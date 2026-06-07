const express = require('express');
const { findRelevantChunks } = require('../utils/retriever');
const { ollama } = require('../utils/openaiClient');

const router = express.Router();

// POST /api/ask
router.post('/', async (req, res) => {
  const { question, documentId } = req.body;

  if (!question || !documentId) {
    return res.status(400).json({ error: 'question and documentId are required' });
  }

  try {
    // 1. Find the most relevant chunks via similarity search
    const relevantChunks = await findRelevantChunks(question, documentId, 5);

    if (relevantChunks.length === 0) {
      return res.status(404).json({ error: 'No relevant content found in this document' });
    }

    // 2. Build context string with chunk indices as citation labels
    const contextText = relevantChunks
      .map((c, i) => `[Source ${i + 1}]:\n${c.content}`)
      .join('\n\n---\n\n');

    // 3. System prompt — this is the key instruction that prevents hallucination
    const systemPrompt = `You are a precise document assistant. Answer the user's question using ONLY the context provided below. 

Rules:
- If the answer is clearly in the context, answer directly and cite your sources as [Source N].
- If the answer is partially in the context, say what you found and note what's missing.
- If the answer is NOT in the context, say "I couldn't find information about that in this document."
- Never make up information. Never use outside knowledge.
- Be concise. Format your answer in clear paragraphs.

Context:
${contextText}`;

    // 4. Set up SSE streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 5. First event: send the source chunks so UI can show citations
    res.write(`data: ${JSON.stringify({
      type: 'sources',
      sources: relevantChunks.map((c, i) => ({
        label: `Source ${i + 1}`,
        content: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
        similarity: Math.round(c.similarity * 100),
        chunkIndex: c.chunk_index,
      })),
    })}\n\n`);

    console.log("Context length:", contextText.length);
    console.log("Question:", question);

    // 6. Stream the LLM answer token by token
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

    for await (const chunk of stream) {
      const text = chunk.message?.content || '';
    
      if (text) {
        res.write(
          `data: ${JSON.stringify({
            type: 'token',
            text
          })}\n\n`
        );
      }
    }

    // 7. Signal completion
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Ask error:', err);
    // If we already started streaming, send error as event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
