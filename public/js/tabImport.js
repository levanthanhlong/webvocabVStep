const tabImport = {
  init() {
    const submitBtn = document.getElementById('import-submit');
    if (submitBtn.dataset.bound) return;
    submitBtn.dataset.bound = '1';
    submitBtn.addEventListener('click', () => this.handleSubmit());
  },

  async handleSubmit() {
    const textarea = document.getElementById('import-textarea');
    const statusEl = document.getElementById('import-status');
    const resultEl = document.getElementById('import-result');
    const submitBtn = document.getElementById('import-submit');
    const text = textarea.value.trim();

    if (!text) return;

    submitBtn.disabled = true;
    statusEl.textContent = 'Đang nạp và tra cứu phiên âm IPA...';
    resultEl.innerHTML = '';

    try {
      const { imported, errors, importBatch } = await api.importVocab(text);

      statusEl.textContent = imported.length
        ? `Đã nạp ${imported.length} từ vào Lần ${importBatch}, ${errors.length} dòng lỗi.`
        : `Đã nạp 0 từ, ${errors.length} dòng lỗi.`;

      let html = '';
      if (imported.length) {
        html += '<ul class="import-ok-list">' +
          imported.map((e) => `<li>${e.word} — ${e.meaning}</li>`).join('') +
          '</ul>';
      }
      if (errors.length) {
        html += '<ul class="import-error-list">' +
          errors.map((e) => `<li>Dòng ${e.line}: "${e.text}" — ${e.reason}</li>`).join('') +
          '</ul>';
      }
      resultEl.innerHTML = html;

      if (imported.length) textarea.value = '';
    } catch (err) {
      statusEl.textContent = 'Lỗi khi nạp từ vựng. Vui lòng thử lại.';
    } finally {
      submitBtn.disabled = false;
    }
  },
};
