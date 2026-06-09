const db = require('../db');
const { ai } = require('./openaiClient');

async function findRelevantChunks(question, documentId, k = 5) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: question,
  });
  
  const questionEmbedding =
    response.embeddings[0].values;

  console.log(
    "Question embedding size:",
    questionEmbedding.length
  );
    let result;

  console.log("Embedding length:", questionEmbedding.length);
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
    console.log("SEARCHING ALL DOCUMENTS");
    result = await db.query(
      `SELECT
          c.content,
          c.chunk_index,
          d.original_name,
          0.5 AS similarity
       FROM chunks c
       JOIN documents d
         ON c.document_id = d.id
       LIMIT 5`
    );
  }

  return result.rows;
}

module.exports = { findRelevantChunks };
