const db = require('../db');
const { ollama } = require('./openaiClient');

async function findRelevantChunks(question, documentId, k = 5) {

  const response = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: question,
  });

  const questionEmbedding = response.embedding;

  const result = await db.query(
    `SELECT content, chunk_index,
            1 - (embedding <=> $1) AS similarity
     FROM chunks
     WHERE document_id = $2
     ORDER BY embedding <=> $1
     LIMIT $3`,
    [JSON.stringify(questionEmbedding), documentId, k]
  );

  return result.rows;
}

module.exports = { findRelevantChunks };
