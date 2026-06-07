const express = require('express');
const { findRelevantChunks } = require('../utils/retriever');
const { ollama } = require('../utils/openaiClient');

const router = express.Router();

router.post('/', async (req, res) => {
  const { question, documentId } = req.body;
  console.log("QUESTION:", question);
  console.log("DOCUMENT ID:", documentId);

  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const relevantChunks = await findRelevantChunks(question, documentId, 5);
    console.log("CHUNKS FOUND:", relevantChunks.length);

    if (relevantChunks.length === 0) {
      return res.status(404).json({ error: 'No relevant content found in this document' });
    }

    const contextText = relevantChunks
      .map(
        c =>
          `[${c.original_name} - Chunk ${c.chunk_index}]\n${c.content}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are a precise document assistant. Answer the user's question using ONLY the context provided below. 

Context:
${contextText}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log(relevantChunks);

    res.write(`data: ${JSON.stringify({
      type: 'sources',
      sources: relevantChunks.map((c, i) => ({
        label: c.original_name,
        content: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
        similarity: Math.round(c.similarity * 100),
        chunkIndex: c.chunk_index,
      })),
    })}\n\n`);

    console.log("Context length:", contextText.length);
    console.log("Question:", question);

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    });
    
    res.write(`data: ${JSON.stringify({
      type: 'token',
      text: response.message.content
    })}\n\n`);
    
    res.write(`data: ${JSON.stringify({
      type: 'done'
    })}\n\n`);
    
    res.end();

    // for await (const chunk of stream) {
    //   const text = chunk.choices[0]?.delta?.content || '';
    //   if (text) {
    //     res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
    //   }
    // }

//     for await (const chunk of stream) {
//       const text = chunk.message?.content || '';
    
//       if (text) {
//         res.write(
//           `data: ${JSON.stringify({
//             type: 'token',
//             text
//           })}\n\n`
//         );
//       }
//     }

//     res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
//     res.end();
  } catch (err) {
    console.error('Ask error:', err);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;