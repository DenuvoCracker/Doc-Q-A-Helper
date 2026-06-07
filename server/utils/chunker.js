/**
 * Splits text into overlapping chunks for RAG.
 * Overlap ensures answers that straddle chunk boundaries aren't lost.
 *
 * @param {string} text - Raw text from PDF
 * @param {number} chunkSize - Words per chunk (400 is a good default)
 * @param {number} overlap - Words of overlap between chunks (50)
 * @returns {string[]} Array of chunk strings
 */
function chunkText(text, chunkSize = 400, overlap = 50) {
  // Normalise whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');

  if (words.length === 0) return [];
  if (words.length <= chunkSize) return [cleaned];

  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const end = Math.min(i + chunkSize, words.length);
    const chunk = words.slice(i, end).join(' ');
    if (chunk.trim().length > 20) { // skip tiny trailing chunks
      chunks.push(chunk);
    }
    if (end === words.length) break;
    i += chunkSize - overlap;
  }

  return chunks;
}

module.exports = { chunkText };
