const db = require('../db');
const { ollama } = require('./openaiClient');

async function findRelevantChunks(question, documentId, k = 5) {
  const response = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: question,
  });

  const questionEmbedding = response.embedding;
  let result;

  if (documentId) {
    result = await db.query(
      `SELECT
          c.content,
          c.chunk_index,
          d.original_name,
          1 - (c.embedding <=> $1) AS similarity
       FROM chunks c
       JOIN documents d
         ON c.document_id = d.id
       WHERE c.document_id = $2
       ORDER BY c.embedding <=> $1
       LIMIT $3`,
      [JSON.stringify(questionEmbedding), documentId, k]
    );
  } else {
    result = await db.query(
      `SELECT
          c.content,
          c.chunk_index,
          d.original_name,
          1 - (c.embedding <=> $1) AS similarity
       FROM chunks c
       JOIN documents d
         ON c.document_id = d.id
       ORDER BY c.embedding <=> $1
       LIMIT $2`,
      [JSON.stringify(questionEmbedding), k]
    );
  }

  return result.rows;
}

module.exports = { findRelevantChunks };
