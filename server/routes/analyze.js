const express = require('express');
const db = require('../db');
const { genAI } = require('../utils/openaiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({
      error: 'documentId is required'
    });
  }

  try {
    const result = await db.query(
      `SELECT content
       FROM chunks
       WHERE document_id = $1
       ORDER BY chunk_index`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No content found'
      });
    }

    const resumeText = result.rows
      .map(row => row.content)
      .join('\n\n');

    const prompt = `
You are an ATS and software engineering recruiter.

Analyze the resume and provide:

1. ATS Score (0-100)
2. Technical Skills Assessment
3. Resume Strengths
4. Areas for Improvement
5. Missing Industry-Standard Sections
6. Specific Actionable Suggestions

Do NOT recommend references.
Do NOT recommend sections unless they are genuinely useful.
Focus on software engineering internships and entry-level roles.

Return clean markdown.

Resume:

${resumeText}
`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
    
    const geminiResult = await model.generateContentStream(prompt);
    
    for await (const chunk of geminiResult.stream) {
      const text = chunk.text();
    
      if (text) {
        res.write(
          `data: ${JSON.stringify({
            type: 'token',
            text,
          })}\n\n`
        );
      }
    }

  res.write(
    `data: ${JSON.stringify({
      type: 'done'
    })}\n\n`
  );

  res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;