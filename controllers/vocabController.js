const pool = require('../config/db');
const { parseVocabText } = require('../services/vocabParser');
const { fetchIpaPhonetic } = require('../services/dictionaryService');

const LEVEL_COLUMNS = { flashcard: 'flashcard_done', quiz: 'quiz_done', fill: 'fill_done' };
const STATUS_CASE = `CASE WHEN flashcard_done = 1 AND quiz_done = 1 AND fill_done = 1 THEN 'memorized' ELSE 'new' END AS status`;

function todayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function importVocab(req, res) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Thiếu nội dung để nạp' });
  }

  const { entries, errors } = parseVocabText(text);
  const importDate = todayDate();
  const imported = [];

  const [[{ nextBatch }]] = await pool.query(
    'SELECT COALESCE(MAX(import_batch), 0) + 1 AS nextBatch FROM vocabulary'
  );

  console.log(`[Import] Nhận ${entries.length} dòng hợp lệ, ${errors.length} dòng lỗi (Lần ${nextBatch}, ngày ${importDate})`);
  errors.forEach((e) => console.log(`[Import]   ✗ Dòng ${e.line}: "${e.text}" — ${e.reason}`));

  for (const entry of entries) {
    console.log(`[Import] Đang tra IPA cho "${entry.word}"...`);
    const phoneticIpa = await fetchIpaPhonetic(entry.word);
    console.log(
      phoneticIpa
        ? `[Import]   ✓ IPA: ${phoneticIpa}`
        : `[Import]   ⚠ Không tìm thấy IPA cho "${entry.word}"`
    );

    const [result] = await pool.query(
      `INSERT INTO vocabulary (word, phonetic, phonetic_ipa, word_type, meaning, example, import_date, import_batch)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.word, entry.phonetic, phoneticIpa, entry.word_type, entry.meaning, entry.example, importDate, nextBatch]
    );
    imported.push({ id: result.insertId, ...entry, phonetic_ipa: phoneticIpa, import_date: importDate, import_batch: nextBatch });
    console.log(`[Import]   → Đã lưu id=${result.insertId}: "${entry.word}"`);
  }

  console.log(`[Import] Hoàn tất: đã nạp ${imported.length}/${entries.length} từ vào Lần ${nextBatch}`);

  res.json({ imported, errors, importDate, importBatch: nextBatch });
}

async function listVocab(req, res) {
  const { search } = req.query;
  let rows;
  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    [rows] = await pool.query(
      `SELECT *, ${STATUS_CASE} FROM vocabulary WHERE word LIKE ? OR meaning LIKE ? ORDER BY word ASC`,
      [like, like]
    );
  } else {
    [rows] = await pool.query(`SELECT *, ${STATUS_CASE} FROM vocabulary ORDER BY word ASC`);
  }
  res.json(rows);
}

async function listImportBatches(req, res) {
  const [rows] = await pool.query(
    `SELECT import_batch, MIN(import_date) AS import_date, COUNT(*) AS total
     FROM vocabulary
     GROUP BY import_batch
     ORDER BY import_batch DESC`
  );
  res.json(rows);
}

async function listByImportBatch(req, res) {
  const { batch } = req.params;
  const [rows] = await pool.query(
    `SELECT *, ${STATUS_CASE} FROM vocabulary WHERE import_batch = ? ORDER BY word ASC`,
    [batch]
  );
  res.json(rows);
}

async function resetImportBatch(req, res) {
  const { batch } = req.params;
  await pool.query(
    'UPDATE vocabulary SET flashcard_done = 0, quiz_done = 0, fill_done = 0 WHERE import_batch = ?',
    [batch]
  );
  res.json({ success: true });
}

async function studyBatch(req, res) {
  const { batch: importBatchNo, mode } = req.query;
  const column = LEVEL_COLUMNS[mode];
  if (!importBatchNo || !column) {
    return res.status(400).json({ error: 'Thiếu tham số batch hoặc mode không hợp lệ' });
  }

  const [batch] = await pool.query(
    `SELECT * FROM vocabulary WHERE import_batch = ? AND ${column} = 0 ORDER BY id ASC LIMIT 10`,
    [importBatchNo]
  );
  const [[{ remaining }]] = await pool.query(
    `SELECT COUNT(*) AS remaining FROM vocabulary WHERE import_batch = ? AND ${column} = 0`,
    [importBatchNo]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM vocabulary WHERE import_batch = ?`,
    [importBatchNo]
  );

  res.json({ batch, remaining, total });
}

async function reviewBatch(req, res) {
  const count = Number(req.query.count) || 10;

  const [batch] = await pool.query(
    `SELECT * FROM vocabulary
     WHERE flashcard_done = 1 AND quiz_done = 1 AND fill_done = 1
     ORDER BY RAND() LIMIT ?`,
    [count]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM vocabulary WHERE flashcard_done = 1 AND quiz_done = 1 AND fill_done = 1`
  );

  res.json({ batch, total });
}

async function markStudy(req, res) {
  const { id, mode, done } = req.body;
  if (!id || typeof done !== 'boolean') {
    return res.status(400).json({ error: 'Tham số không hợp lệ' });
  }

  if (mode === 'all') {
    const value = done ? 1 : 0;
    await pool.query(
      'UPDATE vocabulary SET flashcard_done = ?, quiz_done = ?, fill_done = ? WHERE id = ?',
      [value, value, value, id]
    );
  } else {
    const column = LEVEL_COLUMNS[mode];
    if (!column) return res.status(400).json({ error: 'Tham số không hợp lệ' });
    await pool.query(`UPDATE vocabulary SET ${column} = ? WHERE id = ?`, [done ? 1 : 0, id]);
  }

  res.json({ success: true });
}

async function randomDistractors(req, res) {
  const { exclude_id, count } = req.query;
  const n = Number(count) || 3;
  const [rows] = await pool.query(
    'SELECT id, meaning FROM vocabulary WHERE id != ? ORDER BY RAND() LIMIT ?',
    [Number(exclude_id) || 0, n]
  );
  res.json(rows);
}

async function deleteVocab(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM vocabulary WHERE id = ?', [id]);
  res.json({ success: true });
}

async function bulkDeleteVocab(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Thiếu danh sách id cần xóa' });
  }
  await pool.query('DELETE FROM vocabulary WHERE id IN (?)', [ids]);
  res.json({ success: true, deleted: ids.length });
}

async function deleteImportBatch(req, res) {
  const { batch } = req.params;
  const [result] = await pool.query('DELETE FROM vocabulary WHERE import_batch = ?', [batch]);
  res.json({ success: true, deleted: result.affectedRows });
}

async function updateVocab(req, res) {
  const { id } = req.params;
  const allowedFields = ['word', 'phonetic', 'phonetic_ipa', 'word_type', 'meaning', 'example'];
  const updates = Object.keys(req.body).filter((k) => allowedFields.includes(k));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });
  }

  const setClause = updates.map((field) => `${field} = ?`).join(', ');
  const values = updates.map((field) => req.body[field]);
  await pool.query(`UPDATE vocabulary SET ${setClause} WHERE id = ?`, [...values, id]);
  res.json({ success: true });
}

module.exports = {
  importVocab,
  listVocab,
  listImportBatches,
  listByImportBatch,
  resetImportBatch,
  studyBatch,
  reviewBatch,
  markStudy,
  randomDistractors,
  updateVocab,
  deleteVocab,
  bulkDeleteVocab,
  deleteImportBatch,
};
