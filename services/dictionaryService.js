const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const TRANSLATE_API = 'https://api.mymemory.translated.net/get';

/**
 * Looks up IPA phonetic for a word via Free Dictionary API.
 * Returns null if not found or the request fails, so callers never
 * block an import batch on a single lookup failure.
 */
async function fetchIpaPhonetic(word) {
  try {
    const res = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word)}`);
    if (!res.ok) return null;

    const entries = await res.json();
    for (const entry of entries) {
      if (entry.phonetic) return entry.phonetic;
      const withText = (entry.phonetics || []).find((p) => p.text);
      if (withText) return withText.text;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Looks up full definitions for a word via Free Dictionary API, for the
 * "Từ điển" lookup tool (distinct from fetchIpaPhonetic, which only grabs
 * the phonetic used during vocab import). Returns null if not found.
 */
async function fetchWordDefinition(word) {
  try {
    const res = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word)}`);
    if (!res.ok) return null;

    const entries = await res.json();
    const entry = entries[0];
    if (!entry) return null;

    const phonetic = entry.phonetic || (entry.phonetics || []).find((p) => p.text)?.text || '';

    const meanings = (entry.meanings || []).map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions || []).slice(0, 3).map((d) => ({
        definition: d.definition,
        example: d.example || null,
        synonyms: d.synonyms || [],
      })),
    }));

    return { word: entry.word, phonetic, meanings };
  } catch {
    return null;
  }
}

/**
 * Looks up a Vietnamese translation for a word via MyMemory Translation API
 * (free, no API key). Returns null if not found or the request fails.
 */
async function fetchVietnameseMeaning(word) {
  try {
    const url = `${TRANSLATE_API}?q=${encodeURIComponent(word)}&langpair=en|vi`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const translated = data.responseData?.translatedText;
    if (!translated || /no translation|invalid/i.test(translated)) return null;
    return translated;
  } catch {
    return null;
  }
}

module.exports = { fetchIpaPhonetic, fetchWordDefinition, fetchVietnameseMeaning };
