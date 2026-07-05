const tabSkill = {
  state: {
    skill: localStorage.getItem('skillTab') || 'reading',
  },

  async init() {
    document.querySelectorAll('#tab-skill .mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.skill === this.state.skill);
      if (!btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
          this.state.skill = btn.dataset.skill;
          localStorage.setItem('skillTab', this.state.skill);
          document.querySelectorAll('#tab-skill .mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
          this.load();
        });
      }
    });

    await this.load();
  },

  async load() {
    const container = document.getElementById('skill-content');
    container.textContent = 'Đang tải...';

    const res = await fetch(`/api/docs/${this.state.skill}`);
    const { content } = await res.json();
    container.textContent = content.trim() || 'Chưa có nội dung. Hãy thêm vào file tương ứng trong thư mục docs/.';
  },
};
