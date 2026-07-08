const tabList = {
  debounceTimer: null,

  init() {
    const searchInput = document.getElementById('list-search');
    if (!searchInput.dataset.bound) {
      searchInput.dataset.bound = '1';
      searchInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.load(searchInput.value), 300);
      });
    }
    this.load();
  },

  async load(search = '') {
    const container = document.getElementById('list-container');
    const words = await api.listVocab(search);
    container.innerHTML = words.map((w) => this.renderCard(w)).join('') ||
      '<p class="stage-empty">Không tìm thấy từ nào.</p>';
    this.bindCardEvents(container);
  },

  renderCard(w, options = {}) {
    const checkbox = options.selectable
      ? `<input type="checkbox" class="select-checkbox" data-id="${w.id}" />`
      : '';
    return `
      <div class="vocab-card" data-id="${w.id}">
        <div class="vocab-card-top">
          <div class="vocab-card-main">
            ${checkbox}
            <span class="vocab-word">${w.word}</span>
            <button class="speak-btn" data-speak="${this.escape(w.word)}">🔊</button>
            <span class="vocab-phonetic">/${w.phonetic || ''}/</span>
            <span class="ipa-edit">
              <span class="vocab-phonetic ipa-display">${w.phonetic_ipa || '(chưa có IPA)'}</span>
              <button class="btn-secondary ipa-edit-btn" data-id="${w.id}" style="padding:2px 8px;font-size:0.75rem;">Sửa</button>
            </span>
            <span class="vocab-type">${w.word_type || ''}</span>
          </div>
          <div class="vocab-card-actions">
            <button class="status-badge ${w.status}" data-id="${w.id}" data-status="${w.status}">
              ${w.status === 'memorized' ? 'Đã thuộc' : 'Chưa thuộc'}
            </button>
            <button class="delete-btn" data-id="${w.id}" title="Xóa từ này">🗑</button>
          </div>
        </div>
        <div class="vocab-meaning">${w.meaning}</div>
        <div class="vocab-example">
          → ${w.example || ''}
          ${w.example ? `<button class="speak-btn" data-speak="${this.escape(w.example)}">🔊</button>` : ''}
        </div>
      </div>
    `;
  },

  escape(str) {
    return (str || '').replace(/"/g, '&quot;');
  },

  bindCardEvents(container) {
    container.querySelectorAll('[data-speak]').forEach((btn) => {
      btn.addEventListener('click', () => speak(btn.dataset.speak));
    });

    container.querySelectorAll('.status-badge').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status === 'memorized' ? 'new' : 'memorized';
        await api.markStudy(btn.dataset.id, 'all', newStatus === 'memorized');
        btn.dataset.status = newStatus;
        btn.className = `status-badge ${newStatus}`;
        btn.textContent = newStatus === 'memorized' ? 'Đã thuộc' : 'Chưa thuộc';
      });
    });

    container.querySelectorAll('.ipa-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.editIpa(btn));
    });

    container.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.vocab-card');
        const word = card.querySelector('.vocab-word').textContent;
        if (!window.confirm(`Xóa từ "${word}"? Không thể hoàn tác.`)) return;
        await api.deleteVocab(btn.dataset.id);

        if (container.id === 'by-date-container' && typeof tabByDate !== 'undefined') {
          // Refresh fully: batch word count / dropdown label / empty-batch state
          // all depend on server data, not just the removed card.
          await tabByDate.init();
        } else {
          card.remove();
        }
      });
    });
  },

  editIpa(btn) {
    const wrapper = btn.closest('.ipa-edit');
    const display = wrapper.querySelector('.ipa-display');
    const current = display.textContent === '(chưa có IPA)' ? '' : display.textContent;

    wrapper.innerHTML = `
      <input type="text" value="${this.escape(current)}" class="ipa-input" />
      <button class="btn-secondary ipa-save-btn" style="padding:2px 8px;font-size:0.75rem;">Lưu</button>
    `;

    wrapper.querySelector('.ipa-save-btn').addEventListener('click', async () => {
      const value = wrapper.querySelector('.ipa-input').value.trim();
      await api.updateVocab(btn.dataset.id, { phonetic_ipa: value });
      wrapper.innerHTML = `
        <span class="vocab-phonetic ipa-display">${value || '(chưa có IPA)'}</span>
        <button class="btn-secondary ipa-edit-btn" data-id="${btn.dataset.id}" style="padding:2px 8px;font-size:0.75rem;">Sửa</button>
      `;
      wrapper.querySelector('.ipa-edit-btn').addEventListener('click', () => this.editIpa(wrapper.querySelector('.ipa-edit-btn')));
    });
  },
};
