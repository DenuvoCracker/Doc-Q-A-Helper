const db = require('../db');
const { ollama } = require('./openaiClient');

const MAX_CHUNKS = 200; // safety cap during development

/**
 * Embeds all chunks and stores them in Postgres with the document_id.
 * Processes in small batches to avoid rate limits.
 */
async function embedAndStore(chunks, documentId) {
  const limited = chunks.slice(0, MAX_CHUNKS);

  for (let i = 0; i < limited.length; i++) {
    const content = limited[i].replace(/\0/g, '');
  
    const response = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: content,
    });
  
    await db.query(
      `INSERT INTO chunks
       (document_id, content, chunk_index, embedding)
       VALUES ($1, $2, $3, $4)`,
      [
        documentId,
        content,
        i,
        JSON.stringify(response.embedding),
      ]
    );
  }

  // for (let i = 0; i < limited.length; i += BATCH_SIZE) {
  //   const batch = limited.slice(i, i + BATCH_SIZE);

  //   const response = await ollama.embed({
  //     model: 'nomic-embed-text',
  //     input: batch,
  //   });

  //   const inserts = batch.map((content, j) => ({
  //     content,
  //     embedding: response.embeddings[j],
  //     chunkIndex: i + j,
  //   }));

  //   for (const { content, embedding, chunkIndex } of inserts) {
  //     await db.query(
  //       `INSERT INTO chunks (document_id, content, chunk_index, embedding)
  //        VALUES ($1, $2, $3, $4)`,
  //       [documentId, content, chunkIndex, JSON.stringify(embedding)]
  //     );
  //   }
  // }

  // Update document chunk count
  await db.query(
    `UPDATE documents SET chunk_count = $1 WHERE id = $2`,
    [limited.length, documentId]
  );

  return limited.length;
}

module.exports = { embedAndStore };
