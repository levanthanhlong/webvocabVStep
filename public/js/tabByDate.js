const tabByDate = {
  async init() {
    const select = document.getElementById('by-date-select');
    const batches = await api.listImportBatches();

    select.innerHTML = batches
      .map((b) => `<option value="${b.import_batch}">Lần ${b.import_batch} — ${this.formatDate(b.import_date)} (${b.total} từ)</option>`)
      .join('');

    if (!select.dataset.bound) {
      select.dataset.bound = '1';
      select.addEventListener('change', () => this.load(select.value));
    }

    const resetBtn = document.getElementById('reset-batch-btn');
    if (!resetBtn.dataset.bound) {
      resetBtn.dataset.bound = '1';
      resetBtn.addEventListener('click', () => this.resetCurrentBatch(select));
    }

    const deleteBatchBtn = document.getElementById('delete-batch-btn');
    if (!deleteBatchBtn.dataset.bound) {
      deleteBatchBtn.dataset.bound = '1';
      deleteBatchBtn.addEventListener('click', () => this.deleteCurrentBatch(select));
    }

    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    if (!deleteSelectedBtn.dataset.bound) {
      deleteSelectedBtn.dataset.bound = '1';
      deleteSelectedBtn.addEventListener('click', () => this.deleteSelected(select));
    }

    if (batches.length) this.load(select.value);
    else {
      document.getElementById('by-date-container').innerHTML = '<p class="stage-empty">Chưa có lần nạp nào.</p>';
      this.updateSelectedCount();
    }
  },

  async resetCurrentBatch(select) {
    const batch = select.value;
    if (!batch) return;
    const label = select.options[select.selectedIndex]?.textContent || `Lần ${batch}`;
    const confirmed = window.confirm(`Reset toàn bộ tiến độ học của "${label}"? Chỉ các từ trong lần nạp này bị ảnh hưởng, các lần nạp khác giữ nguyên.`);
    if (!confirmed) return;

    await api.resetImportBatch(batch);
    this.load(batch);
  },

  async deleteCurrentBatch(select) {
    const batch = select.value;
    if (!batch) return;
    const label = select.options[select.selectedIndex]?.textContent || `Lần ${batch}`;
    const confirmed = window.confirm(`Xóa toàn bộ "${label}"? Toàn bộ từ trong lần nạp này sẽ mất vĩnh viễn, không thể hoàn tác.`);
    if (!confirmed) return;

    await api.deleteImportBatch(batch);
    await this.init();
  },

  async deleteSelected(select) {
    const container = document.getElementById('by-date-container');
    const ids = Array.from(container.querySelectorAll('.select-checkbox:checked')).map((cb) => cb.dataset.id);
    if (!ids.length) return;

    const confirmed = window.confirm(`Xóa ${ids.length} từ đã chọn? Không thể hoàn tác.`);
    if (!confirmed) return;

    await api.bulkDeleteVocab(ids);
    await this.init();
  },

  updateSelectedCount() {
    const container = document.getElementById('by-date-container');
    const count = container.querySelectorAll('.select-checkbox:checked').length;
    const btn = document.getElementById('delete-selected-btn');
    btn.textContent = `Xóa các từ đã chọn (${count})`;
    btn.disabled = count === 0;
  },

  formatDate(isoDate) {
    const [y, m, d] = String(isoDate).slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  },

  async load(batch) {
    const container = document.getElementById('by-date-container');
    const words = await api.listByImportBatch(batch);
    container.innerHTML = words.map((w) => tabList.renderCard(w, { selectable: true })).join('') ||
      '<p class="stage-empty">Không có từ nào trong lần nạp này.</p>';
    tabList.bindCardEvents(container);

    container.querySelectorAll('.select-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => this.updateSelectedCount());
    });
    this.updateSelectedCount();
  },
};
