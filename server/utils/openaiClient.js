const ollama = require('ollama').default;
// require('dotenv').config();

// let client = null;

// function getOpenAI() {
//   if (!client) {
//     if (!process.env.OPENAI_API_KEY) {
//       throw new Error('OPENAI_API_KEY is not set in your .env file');
//     }
//     client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//   }
//   return client;
// }

module.exports = { ollama };
