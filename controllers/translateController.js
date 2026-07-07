const { translateText } = require('../services/dictionaryService');

const MAX_TEXT_LENGTH = 500;

async function translate(req, res) {
  const { text, from, to } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Thiếu văn bản cần dịch' });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: `Văn bản quá dài (tối đa ${MAX_TEXT_LENGTH} ký tự mỗi lần dịch)` });
  }

  const translated = await translateText(text.trim(), from || 'en', to || 'vi');
  if (translated === null) {
    return res.status(502).json({ error: 'Không dịch được, thử lại sau' });
  }
  res.json({ translated });
}

module.exports = { translate };
