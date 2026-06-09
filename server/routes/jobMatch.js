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

Return as a comma-separated list.
Return ONLY skill names.

Example:
React, JavaScript, SQL

Do NOT include explanations.
Do NOT include bullet points.
Do NOT include parentheses.
Do NOT include any text other that the skill names.

# Missing Skills

Return as a comma-separated list.
Return ONLY skill names.

Example:
Docker, AWS, Git

Do NOT include explanations.
Do NOT include bullet points.
Do NOT include parentheses.
Do NOT include any text other that the skill names.

# Resume Strengths For This Role

# Weaknesses For This Role

# Recommended Projects
(Always provide at least 2 project ideas.)

# Recommended Certifications
(Always provide at least 2 certifications.)

# Action Plan
(Atlest provide a 3-step action plan.)

Never write:
"None mentioned"
"No strengths mentioned"
"No weaknesses mentioned"

If information is limited, make a reasonable recommendation based on the resume and job description.

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