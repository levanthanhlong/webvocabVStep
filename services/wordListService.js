const fs = require('fs');
const path = require('path');

const WORD_LIST_PATH = path.join(__dirname, '..', 'data', 'common-english-words.txt');

// Loaded once at startup — ~10k short lines, trivial memory footprint.
const words = fs
  .readFileSync(WORD_LIST_PATH, 'utf-8')
  .split('\n')
  .map((w) => w.trim())
  .filter(Boolean);

/**
 * Prefix-searches the bundled list of common English words (independent of
 * the user's own vocabulary DB), so "Từ điển" can suggest words the user
 * hasn't imported yet.
 */
function suggestFromWordList(prefix, limit = 8) {
  const lower = prefix.toLowerCase();
  const matches = [];
  for (const word of words) {
    if (word.startsWith(lower)) {
      matches.push(word.charAt(0).toUpperCase() + word.slice(1));
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

module.exports = { suggestFromWordList };
