const { ollama } = require('./utils/openaiClient');

(async () => {
  const contextText = `
Hrishit Rai
Skills: C, C++, Python, Java, HTML, CSS, JavaScript.
`;

  try {
    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [
        {
          role: 'system',
          content: `Answer only from this context:\n${contextText}`
        },
        {
          role: 'user',
          content: 'What skills does Hrishit have?'
        }
      ]
    });

    console.log(response.message.content);
  } catch (err) {
    console.error(err);
  }
})();