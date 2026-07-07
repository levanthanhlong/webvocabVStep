document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

      if (btn.dataset.tab === 'list') tabList.init();
      if (btn.dataset.tab === 'study') tabStudy.init();
      if (btn.dataset.tab === 'by-date') tabByDate.init();
      if (btn.dataset.tab === 'skill') tabSkill.init();
      if (btn.dataset.tab === 'dictionary') tabDictionary.init();
      if (btn.dataset.tab === 'translate') tabTranslate.init();
    });
  });

  tabImport.init();
});
