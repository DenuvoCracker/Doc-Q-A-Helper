const express = require('express');
const db = require('../db');
const { ollama } = require('../utils/openaiClient');

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

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    res.json({
      analysis: response.message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;