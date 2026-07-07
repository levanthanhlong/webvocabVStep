const tabDictionary = {
  state: {
    direction: localStorage.getItem('dictDirection') || 'en-vi',
  },

  init() {
    const btn = document.getElementById('dictionary-search-btn');
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';

    document.querySelectorAll('.dict-dir-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.dir === this.state.direction);
      b.addEventListener('click', () => {
        this.state.direction = b.dataset.dir;
        localStorage.setItem('dictDirection', this.state.direction);
        document.querySelectorAll('.dict-dir-btn').forEach((x) => x.classList.toggle('active', x === b));
        this.updatePlaceholder();
        document.getElementById('dictionary-input').value = '';
        document.getElementById('dictionary-result').innerHTML = '';
      });
    });
    this.updatePlaceholder();

    btn.addEventListener('click', () => this.search());
    document.getElementById('dictionary-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.search();
    });
  },

  updatePlaceholder() {
    const isEnVi = this.state.direction === 'en-vi';
    document.getElementById('dictionary-input').placeholder = isEnVi
      ? 'Nhập từ tiếng Anh cần tra (vd: abandon)...'
      : 'Nhập từ tiếng Việt cần tra (vd: từ bỏ)...';
  },

  async search() {
    const input = document.getElementById('dictionary-input');
    const resultEl = document.getElementById('dictionary-result');
    const word = input.value.trim();
    if (!word) return;

    resultEl.innerHTML = '<p class="stage-empty">Đang tra...</p>';

    const isEnVi = this.state.direction === 'en-vi';
    const url = isEnVi
      ? `/api/dictionary/${encodeURIComponent(word)}`
      : `/api/dictionary/vi/${encodeURIComponent(word)}`;
    const res = await fetch(url);
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

    const viList = data.meanings_vi || [];
    const enList = data.translated_en
      ? (Array.isArray(data.translated_en) ? data.translated_en : [data.translated_en])
      : [];

    const translationChips = viList.length
      ? viList.map((m) => `<span class="dict-meaning-vi">🇻🇳 ${this.escape(m)}</span>`).join('')
      : enList.length
      ? enList.map((m) => `<span class="dict-meaning-vi">🇬🇧 ${this.escape(m)}</span>`).join('')
      : '';

    const speakTarget = enList[0] || data.word;
    const noDefinitionsHint = !data.meanings.length && enList.length
      ? '<p class="hint">Không có định nghĩa tiếng Anh chi tiết cho cụm dịch này.</p>'
      : '';

    return `
      <div class="dict-entry">
        <div class="dict-word-row">
          <span class="dict-word">${this.escape(data.word)}</span>
          <button class="speak-btn" data-speak="${this.escape(speakTarget)}">🔊</button>
          ${data.phonetic ? `<span class="vocab-phonetic">${this.escape(data.phonetic)}</span>` : ''}
        </div>
        ${translationChips ? `<div class="dict-meaning-list">${translationChips}</div>` : ''}
        ${meaningsHtml}
        ${noDefinitionsHint}
      </div>
    `;
  },

  escape(str) {
    return (str || '').replace(/"/g, '&quot;');
  },
};
