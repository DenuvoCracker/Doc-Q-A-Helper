/**
@param {string} text
@param {number} chunkSize
@param {number} overlap
@returns {string[]}
*/
function chunkText(text, chunkSize = 400, overlap = 50) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');

  if (words.length === 0) return [];
  if (words.length <= chunkSize) return [cleaned];

  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const end = Math.min(i + chunkSize, words.length);
    const chunk = words.slice(i, end).join(' ');
    if (chunk.trim().length > 20) {
      chunks.push(chunk);
    }
    if (end === words.length) break;
    i += chunkSize - overlap;
  }

  return chunks;
}

module.exports = { chunkText };
