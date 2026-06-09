const path = require('path');
const { GoogleGenAI } = require('@google/genai');


require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: 'Hello world',
  });

  console.log(result.embeddings.length);
  console.log(result.embeddings[0]);
}

test().catch(console.error);