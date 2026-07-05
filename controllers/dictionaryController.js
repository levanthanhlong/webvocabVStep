const { fetchWordDefinition, fetchVietnameseMeaning } = require('../services/dictionaryService');

async function lookupWord(req, res) {
  const { word } = req.params;
  const [result, meaningVi] = await Promise.all([
    fetchWordDefinition(word),
    fetchVietnameseMeaning(word),
  ]);

  if (!result) {
    return res.status(404).json({ found: false });
  }
  res.json({ found: true, ...result, meaning_vi: meaningVi });
}

module.exports = { lookupWord };
