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
 * Translates text (a word, phrase, or full paragraph) between languages via
 * MyMemory Translation API (free, no API key). Returns null if not found or
 * the request fails, so callers can fall back gracefully.
 */
async function translateText(text, from, to) {
  try {
    const url = `${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
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

/**
 * Translates a single word/short phrase, for dictionary-style lookups.
 * A word usually has several valid meanings (polysemy), so this returns
 * up to `limit` distinct candidates instead of just one. MyMemory's top
 * "best match" is also sometimes a noisy community-submitted entry much
 * longer than the input (e.g. "từ bỏ" -> "not good for your health"
 * instead of "abandon"), even with a high match score — among the
 * high-confidence candidates, shorter translations are ranked first since
 * a real word-for-word answer is rarely a full sentence.
 */
async function translateWordMeanings(word, from, to, limit = 5) {
  try {
    const url = `${TRANSLATE_API}?q=${encodeURIComponent(word)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const candidates = (data.matches || [])
      .filter((m) => m.translation && Number(m.match) >= 0.85)
      .sort((a, b) => {
        const lengthDiff = a.translation.trim().split(/\s+/).length - b.translation.trim().split(/\s+/).length;
        return lengthDiff !== 0 ? lengthDiff : Number(b.match) - Number(a.match);
      })
      .map((m) => m.translation.trim().replace(/[.!?]+$/, ''));

    const deduped = [...new Set(candidates)];
    if (deduped.length) return deduped.slice(0, limit);

    const fallback = data.responseData?.translatedText;
    if (fallback && !/no translation|invalid/i.test(fallback)) return [fallback];
    return [];
  } catch {
    return [];
  }
}

/** Looks up Vietnamese translations for an English word (used by "Từ điển"). */
function fetchVietnameseMeaning(word) {
  return translateWordMeanings(word, 'en', 'vi');
}

/** Looks up English translations for a Vietnamese word (used by "Từ điển"). */
function fetchEnglishMeaning(word) {
  return translateWordMeanings(word, 'vi', 'en');
}

module.exports = {
  fetchIpaPhonetic,
  fetchWordDefinition,
  fetchVietnameseMeaning,
  fetchEnglishMeaning,
  translateText,
};
