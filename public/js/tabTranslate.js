const tabTranslate = {
  state: {
    direction: localStorage.getItem('translateDirection') || 'en-vi',
  },

  init() {
    const btn = document.getElementById('translate-btn');
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';

    document.querySelectorAll('.translate-dir-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.dir === this.state.direction);
      b.addEventListener('click', () => {
        this.state.direction = b.dataset.dir;
        localStorage.setItem('translateDirection', this.state.direction);
        document.querySelectorAll('.translate-dir-btn').forEach((x) => x.classList.toggle('active', x === b));
        this.updatePlaceholder();
        document.getElementById('translate-input').value = '';
        document.getElementById('translate-output').innerHTML = '';
      });
    });
    this.updatePlaceholder();

    btn.addEventListener('click', () => this.translate());
  },

  updatePlaceholder() {
    const isEnVi = this.state.direction === 'en-vi';
    document.getElementById('translate-input').placeholder = isEnVi
      ? 'Nhập văn bản tiếng Anh cần dịch (tối đa 500 ký tự)...'
      : 'Nhập văn bản tiếng Việt cần dịch (tối đa 500 ký tự)...';
  },

  async translate() {
    const input = document.getElementById('translate-input');
    const output = document.getElementById('translate-output');
    const text = input.value.trim();
    if (!text) return;

    output.innerHTML = '<p class="stage-empty">Đang dịch...</p>';

    const [from, to] = this.state.direction.split('-');
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to }),
    });
    const data = await res.json();

    if (!res.ok) {
      output.innerHTML = `<p class="stage-empty">${this.escape(data.error || 'Có lỗi xảy ra')}</p>`;
      return;
    }

    const englishText = this.state.direction === 'en-vi' ? text : data.translated;

    output.innerHTML = `
      <div class="dict-entry">
        <div class="dict-word-row">
          <p class="translate-result-text">${this.escape(data.translated)}</p>
          <button class="speak-btn" data-speak="${this.escape(englishText)}">🔊</button>
        </div>
      </div>
    `;
    output.querySelector('[data-speak]').addEventListener('click', (e) => speak(e.target.dataset.speak));
  },

  escape(str) {
    return (str || '').replace(/"/g, '&quot;');
  },
};
