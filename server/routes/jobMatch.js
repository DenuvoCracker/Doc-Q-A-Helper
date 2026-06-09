const express = require('express');
const db = require('../db');
const { ollama } = require('../utils/openaiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { documentId, jobDescription } = req.body;

  if (!documentId || !jobDescription) {
    return res.status(400).json({
      error: 'documentId and jobDescription are required'
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
        error: 'No resume content found'
      });
    }

    const resumeText = result.rows
      .map(row => row.content)
      .join('\n\n');

    const prompt = `
You are an ATS and software engineering recruiter.

Compare the resume against the job description.

Provide:

# Match Score (0-100)

# Matching Skills

# Missing Skills

# Resume Strengths For This Role

# Weaknesses For This Role

# Recommended Projects

# Recommended Certifications

# Action Plan

Return clean markdown.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log("Starting stream...");

    const stream = await ollama.chat({
      model: 'llama3.2:3b',
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    for await (const chunk of stream) {
      const text = chunk.message?.content || '';

      console.log("Chunk:", text);

      if (text) {
        res.write(
          `data: ${JSON.stringify({
            type: 'token',
            text
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

    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: err.message
        })}\n\n`
      );

      res.end();
    } else {
      res.status(500).json({
        error: err.message
      });
    }
  }
});

module.exports = router;