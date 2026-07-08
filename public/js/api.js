const api = {
  async importVocab(text) {
    const res = await fetch('/api/vocab/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async listVocab(search) {
    const url = search ? `/api/vocab?search=${encodeURIComponent(search)}` : '/api/vocab';
    const res = await fetch(url);
    return res.json();
  },

  async suggestWords(prefix, field) {
    const res = await fetch(`/api/vocab/suggest?prefix=${encodeURIComponent(prefix)}&field=${field}`);
    return res.json();
  },

  async listImportBatches() {
    const res = await fetch('/api/vocab/batches');
    return res.json();
  },

  async listByImportBatch(batch) {
    const res = await fetch(`/api/vocab/by-batch/${batch}`);
    return res.json();
  },

  async resetImportBatch(batch) {
    const res = await fetch(`/api/vocab/by-batch/${batch}/reset`, { method: 'POST' });
    return res.json();
  },

  async studyBatch(importBatch, mode) {
    const res = await fetch(`/api/vocab/study/batch?batch=${importBatch}&mode=${mode}`);
    return res.json();
  },

  async reviewBatch(count) {
    const res = await fetch(`/api/vocab/review/batch?count=${count}`);
    return res.json();
  },

  async markStudy(id, mode, done) {
    const res = await fetch('/api/vocab/study/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, mode, done }),
    });
    return res.json();
  },

  async randomDistractors(excludeId, count, wordType, isPhrase) {
    const params = new URLSearchParams({ exclude_id: excludeId, count });
    if (wordType) params.set('word_type', wordType);
    if (isPhrase !== undefined) params.set('is_phrase', isPhrase);
    const res = await fetch(`/api/vocab/random?${params.toString()}`);
    return res.json();
  },

  async updateVocab(id, fields) {
    const res = await fetch(`/api/vocab/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    return res.json();
  },

  async deleteVocab(id) {
    const res = await fetch(`/api/vocab/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async bulkDeleteVocab(ids) {
    const res = await fetch('/api/vocab/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    return res.json();
  },

  async deleteImportBatch(batch) {
    const res = await fetch(`/api/vocab/by-batch/${batch}`, { method: 'DELETE' });
    return res.json();
  },
};
