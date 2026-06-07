const db = require('../db');
const { ollama } = require('./openaiClient');

/**
 * Embeds the user's question, then finds the k most similar chunks
 * using cosine distance in pgvector (<=> operator).
 */
async function findRelevantChunks(question, documentId, k = 5) {
  // const openai = getOpenAI();

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

  return result.rows; // [{ content, chunk_index, similarity }]
}

module.exports = { findRelevantChunks };
