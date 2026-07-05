const tabDictionary = {
  init() {
    const btn = document.getElementById('dictionary-search-btn');
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => this.search());
    document.getElementById('dictionary-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.search();
    });
  },

  async search() {
    const input = document.getElementById('dictionary-input');
    const resultEl = document.getElementById('dictionary-result');
    const word = input.value.trim();
    if (!word) return;

    resultEl.innerHTML = '<p class="stage-empty">Đang tra...</p>';

    const res = await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
    const data = await res.json();

    if (!data.found) {
      resultEl.innerHTML = `<p class="stage-empty">Không tìm thấy từ "${this.escape(word)}".</p>`;
      return;
    }

    resultEl.innerHTML = this.renderEntry(data);
    resultEl.querySelectorAll('[data-speak]').forEach((b) => {
      b.addEventListener('click', (e) => speak(e.target.dataset.speak));
    });
  },

  renderEntry(data) {
    const meaningsHtml = data.meanings.map((m) => `
      <div class="dict-meaning-block">
        <div class="dict-pos">${this.escape(m.partOfSpeech)}</div>
        <ol class="dict-definitions">
          ${m.definitions.map((d) => `
            <li>
              <div>${this.escape(d.definition)}</div>
              ${d.example ? `<div class="dict-example">→ ${this.escape(d.example)}</div>` : ''}
              ${d.synonyms.length ? `<div class="dict-synonyms">Đồng nghĩa: ${d.synonyms.slice(0, 5).map((s) => this.escape(s)).join(', ')}</div>` : ''}
            </li>
          `).join('')}
        </ol>
      </div>
    `).join('');

    return `
      <div class="dict-entry">
        <div class="dict-word-row">
          <span class="dict-word">${this.escape(data.word)}</span>
          <button class="speak-btn" data-speak="${this.escape(data.word)}">🔊</button>
          ${data.phonetic ? `<span class="vocab-phonetic">${this.escape(data.phonetic)}</span>` : ''}
        </div>
        ${data.meaning_vi ? `<div class="dict-meaning-vi">🇻🇳 ${this.escape(data.meaning_vi)}</div>` : ''}
        ${meaningsHtml}
      </div>
    `;
  },

  escape(str) {
    return (str || '').replace(/"/g, '&quot;');
  },
};
