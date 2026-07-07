const { fetchWordDefinition, fetchVietnameseMeaning, fetchEnglishMeaning } = require('../services/dictionaryService');

async function lookupWord(req, res) {
  const { word } = req.params;
  const [result, meaningsVi] = await Promise.all([
    fetchWordDefinition(word),
    fetchVietnameseMeaning(word),
  ]);

  if (!result) {
    return res.status(404).json({ found: false });
  }
  res.json({ found: true, ...result, meanings_vi: meaningsVi });
}

async function lookupVietnameseWord(req, res) {
  const { word } = req.params;
  const translatedEnList = await fetchEnglishMeaning(word);

  if (!translatedEnList.length) {
    return res.status(404).json({ found: false });
  }

  // Best-effort: enrich with English definitions for the top candidate.
  // The translated phrase may not be an exact dictionary headword
  // (e.g. multi-word translations), so definitions can come back empty.
  const definitionResult = await fetchWordDefinition(translatedEnList[0]);

  res.json({
    found: true,
    word,
    translated_en: translatedEnList,
    phonetic: definitionResult?.phonetic || '',
    meanings: definitionResult?.meanings || [],
  });
}

module.exports = { lookupWord, lookupVietnameseWord };
