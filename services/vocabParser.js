const LINE_PATTERN = /^\d+\.\s*(.+?)\s*\/(.+?)\/\s*\(([^)]+)\)\s*:\s*(.+?)\s*->\s*(.+)$/;

function diagnoseLine(line) {
  if (!/^\d+\./.test(line)) {
    return 'Thiếu số thứ tự và dấu chấm ở đầu dòng, ví dụ "1. "';
  }
  const rest = line.replace(/^\d+\.\s*/, '');
  if (!/\/.+\//.test(rest)) {
    return 'Thiếu cặp dấu "/ .../" bao quanh phần phiên âm (sau từ vựng)';
  }
  if (!/\([^)]+\)/.test(rest)) {
    return 'Thiếu dấu ngoặc "(...)" bao quanh loại từ, ví dụ (n), (v), (adj)';
  }
  if (!/\)\s*:/.test(rest)) {
    return 'Thiếu dấu hai chấm ":" ngay sau loại từ, ví dụ (n): nghĩa';
  }
  if (!/->/.test(rest)) {
    return 'Thiếu mũi tên "->" trước câu ví dụ';
  }
  return 'Sai thứ tự các thành phần — cần đúng dạng: N. từ /phiên âm/ (loại từ): nghĩa -> ví dụ';
}

/**
 * Joins an entry line with a following "-> example" line, so the example
 * may be written on its own line instead of at the end of the entry line.
 */
function mergeContinuationLines(rawLines) {
  const merged = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const current = rawLines[i];
    const next = rawLines[i + 1];
    const isEntryStart = /^\d+\./.test(current);
    const hasArrow = /->/.test(current);
    if (isEntryStart && !hasArrow && next && /^->/.test(next)) {
      merged.push(`${current} ${next}`);
      i += 1;
    } else {
      merged.push(current);
    }
  }
  return merged;
}

/**
 * Parses "N. word /phonetic/ (type): meaning -> example" lines.
 * `word` may contain spaces (phrases like "local authorities" are valid).
 * The "-> example" part may also be written on the following line.
 * Returns { entries, errors } — malformed lines are skipped, not fatal.
 */
function parseVocabText(text) {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const lines = mergeContinuationLines(rawLines);
  const entries = [];
  const errors = [];

  lines.forEach((line, idx) => {
    const match = line.match(LINE_PATTERN);
    if (!match) {
      errors.push({ line: idx + 1, text: line, reason: diagnoseLine(line) });
      return;
    }
    const [, word, phonetic, wordType, meaning, example] = match;
    entries.push({
      word: word.trim(),
      phonetic: phonetic.trim(),
      word_type: wordType.trim(),
      meaning: meaning.trim(),
      example: example.trim(),
    });
  });

  return { entries, errors };
}

module.exports = { parseVocabText };
