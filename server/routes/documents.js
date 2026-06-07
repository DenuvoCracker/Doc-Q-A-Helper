const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../db');
const { chunkText } = require('../utils/chunker');
const { embedAndStore } = require('../utils/embedder');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported'));
    }
  },
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, original_name, page_count, chunk_count, created_at
       FROM documents ORDER BY created_at DESC`
    );
    res.json({ documents: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const parsed = await pdfParse(req.file.buffer);
    const rawText = parsed.text;

    console.log(
      "Contains null byte:",
      rawText.includes('\0')
    );
    const cleanedText = rawText
      .replace(/\0/g, '')
      .replace(/\u0000/g, '');

    if (!cleanedText || cleanedText.trim().length < 50) {
      return res.status(400).json({ error: 'PDF appears to have no readable text (scanned PDFs not supported yet)' });
    }

    const docResult = await db.query(
      `INSERT INTO documents (filename, original_name, page_count)
       VALUES ($1, $2, $3) RETURNING id`,
      [req.file.originalname, req.file.originalname, parsed.numpages]
    );
    const documentId = docResult.rows[0].id;

    const chunks = chunkText(cleanedText, 400, 50);

    const chunkCount = await embedAndStore(chunks, documentId);

    res.json({
      document: {
        id: documentId,
        original_name: req.file.originalname,
        page_count: parsed.numpages,
        chunk_count: chunkCount,
      },
      message: `Processed ${chunkCount} chunks from ${parsed.numpages} pages`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM documents WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
