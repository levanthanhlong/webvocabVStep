const tabStudy = {
  state: {
    importBatch: null,
    mode: localStorage.getItem('studyMode') || 'flashcard',
    batch: [],
    index: 0,
    remaining: 0,
    total: 0,
    testCorrect: 0,
    testTotal: 0,
  },

  async init() {
    const batchSelect = document.getElementById('study-date-select');
    const batches = await api.listImportBatches();

    batchSelect.innerHTML = batches
      .map((b) => `<option value="${b.import_batch}">${this.formatBatchLabel(b)}</option>`)
      .join('');

    if (!batchSelect.dataset.bound) {
      batchSelect.dataset.bound = '1';
      batchSelect.addEventListener('change', () => this.loadBatchForImport(batchSelect.value));
    }

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === this.state.mode);
      if (!btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
          this.state.mode = btn.dataset.mode;
          localStorage.setItem('studyMode', this.state.mode);
          document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
          this.toggleDateVisibility();
          this.loadBatchForImport(this.state.importBatch || batchSelect.value);
        });
      }
    });

    this.toggleDateVisibility();

    if (batches.length) await this.loadBatchForImport(batchSelect.value);
    else document.getElementById('study-stage').innerHTML = '<p class="stage-empty">Chưa có lần nạp nào.</p>';
  },

  toggleDateVisibility() {
    document.getElementById('study-date-select').style.display = this.state.mode === 'review' ? 'none' : '';
  },

  formatDate(isoDate) {
    const [y, m, d] = String(isoDate).slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  },

  formatBatchLabel(b) {
    const namePart = b.batch_name ? `: ${b.batch_name}` : '';
    return `Lần ${b.import_batch}${namePart} — ${this.formatDate(b.import_date)} (${b.total} từ)`;
  },

  async loadBatchForImport(importBatch) {
    this.state.importBatch = importBatch;
    if (this.state.mode === 'review') return this.loadReviewBatch();
    if (this.state.mode === 'test') return this.loadTestBatch();

    const { batch, remaining, total } = await api.studyBatch(importBatch, this.state.mode);
    this.state.batch = batch;
    this.state.index = 0;
    this.state.remaining = remaining;
    this.state.total = total;
    this.renderCurrent();
  },

  async loadNextBatch() {
    if (this.state.mode === 'review') return this.loadReviewBatch();

    const { batch, remaining, total } = await api.studyBatch(this.state.importBatch, this.state.mode);
    this.state.batch = batch;
    this.state.index = 0;
    this.state.remaining = remaining;
    this.state.total = total;
    this.renderCurrent();
  },

  async loadReviewBatch() {
    const { batch, total } = await api.reviewBatch(10);
    this.state.batch = batch;
    this.state.index = 0;
    this.state.remaining = null;
    this.state.total = total;
    this.renderCurrent();
  },

  async loadTestBatch() {
    const words = await api.listByImportBatch(this.state.importBatch);
    const shuffled = this.shuffle(words).map((w) => ({
      ...w,
      testQuestionType: Math.random() < 0.5 ? 'quiz' : 'fill',
    }));
    this.state.batch = shuffled;
    this.state.index = 0;
    this.state.testCorrect = 0;
    this.state.testTotal = shuffled.length;
    this.renderCurrent();
  },

  updateProgress() {
    const el = document.getElementById('study-progress');
    if (this.state.mode === 'review') {
      el.textContent = `Ôn lại ngẫu nhiên trong ${this.state.total} từ đã thuộc`;
    } else if (this.state.mode === 'test') {
      const current = Math.min(this.state.index + 1, this.state.testTotal);
      el.textContent = `Câu ${current}/${this.state.testTotal} — Đúng: ${this.state.testCorrect}`;
    } else {
      el.textContent = `Còn ${this.state.remaining}/${this.state.total} từ chưa thuộc`;
    }
  },

  currentWord() {
    return this.state.batch[this.state.index];
  },

  async advance() {
    this.state.index += 1;
    if (this.state.index >= this.state.batch.length) {
      await this.loadNextBatch();
    } else {
      this.renderCurrent();
    }
  },

  async mark(word, done) {
    await api.markStudy(word.id, this.state.mode, done);
    if (done) {
      this.state.remaining = Math.max(0, this.state.remaining - 1);
    }
  },

  renderCurrent() {
    this.updateProgress();
    const stage = document.getElementById('study-stage');

    if (!this.state.batch.length) {
      let emptyMsg = '🎉 Đã học thuộc hết từ vựng lần nạp này!';
      if (this.state.mode === 'review') emptyMsg = 'Chưa có từ nào được đánh dấu đã thuộc để ôn lại.';
      if (this.state.mode === 'test') emptyMsg = 'Lần nạp này chưa có từ nào để test.';
      stage.innerHTML = `<p class="stage-empty">${emptyMsg}</p>`;
      return;
    }

    const word = this.currentWord();
    if (this.state.mode === 'flashcard') this.renderFlashcard(stage, word);
    else if (this.state.mode === 'quiz') this.renderQuiz(stage, word);
    else if (this.state.mode === 'fill') this.renderFill(stage, word);
    else if (this.state.mode === 'test') this.renderTestQuestion(stage, word);
    else this.renderReview(stage, word);
  },

  advanceTest() {
    this.state.index += 1;
    if (this.state.index >= this.state.batch.length) {
      this.showTestResultPopup();
    } else {
      this.renderCurrent();
    }
  },

  renderFlashcard(stage, word) {
    stage.innerHTML = `
      <div class="stage-word">${word.word} <button class="speak-btn" data-speak="${word.word}">🔊</button></div>
      <div class="stage-phonetic">/${word.phonetic || ''}/ ${word.phonetic_ipa ? `— ${word.phonetic_ipa}` : ''} ${word.word_type ? `<span class="vocab-type">${word.word_type}</span>` : ''}</div>
      <button class="btn-primary" id="reveal-btn">Xem nghĩa</button>
      <div id="reveal-content" style="display:none;">
        <div class="stage-meaning">${word.meaning}</div>
        <div class="stage-example">
          → ${word.example || ''}
          ${word.example ? `<button class="speak-btn" data-speak="${this.escape(word.example)}">🔊</button>` : ''}
        </div>
        <div class="stage-actions">
          <button class="btn-secondary" id="mark-new">Chưa thuộc</button>
          <button class="btn-primary" id="mark-memorized">Đã thuộc</button>
        </div>
      </div>
    `;
    stage.querySelector('[data-speak]').addEventListener('click', (e) => speak(e.target.dataset.speak));

    stage.querySelector('#reveal-btn').addEventListener('click', () => {
      stage.querySelector('#reveal-btn').style.display = 'none';
      const content = stage.querySelector('#reveal-content');
      content.style.display = 'block';
      content.querySelectorAll('[data-speak]').forEach((btn) => btn.addEventListener('click', (e) => speak(e.target.dataset.speak)));

      stage.querySelector('#mark-new').addEventListener('click', async () => {
        await this.mark(word, false);
        this.advance();
      });
      stage.querySelector('#mark-memorized').addEventListener('click', async () => {
        await this.mark(word, true);
        this.advance();
      });
    });
  },

  async renderQuiz(stage, word) {
    const isPhrase = word.word.includes(' ');
    const distractors = await api.randomDistractors(word.id, 3, word.word_type, isPhrase);
    const options = this.shuffle([{ id: word.id, meaning: word.meaning }, ...distractors]);

    stage.innerHTML = `
      <div class="stage-word">${word.word} <button class="speak-btn" data-speak="${word.word}">🔊</button></div>
      <div class="stage-phonetic">/${word.phonetic || ''}/ ${word.word_type ? `<span class="vocab-type">${word.word_type}</span>` : ''}</div>
      <div class="quiz-options">
        ${options.map((o, i) => `<button class="quiz-option" data-correct="${o.id === word.id}" data-index="${i}">${o.meaning}</button>`).join('')}
      </div>
      <div id="quiz-feedback"></div>
    `;
    stage.querySelector('[data-speak]').addEventListener('click', (e) => speak(e.target.dataset.speak));

    stage.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isCorrect = btn.dataset.correct === 'true';
        stage.querySelectorAll('.quiz-option').forEach((b) => (b.disabled = true));
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
          await this.mark(word, true);
          document.getElementById('quiz-feedback').innerHTML = `
            <div class="stage-example">→ ${word.example || ''}</div>
            <div class="stage-actions"><button class="btn-primary" id="quiz-next">Từ tiếp theo</button></div>
          `;
        } else {
          stage.querySelectorAll('.quiz-option').forEach((b) => {
            if (b.dataset.correct === 'true') b.classList.add('correct');
          });
          document.getElementById('quiz-feedback').innerHTML = `
            <div class="stage-actions"><button class="btn-primary" id="quiz-next">Từ tiếp theo</button></div>
          `;
        }
        document.getElementById('quiz-next').addEventListener('click', () => this.advance());
      });
    });
  },

  renderFill(stage, word) {
    const blanked = this.blankOutWord(word.example, word.word);

    stage.innerHTML = `
      <div class="stage-phonetic">Gợi ý: ${word.meaning} (${word.word_type || ''})</div>
      <div class="fill-sentence">${blanked}</div>
      <input type="text" id="fill-input" class="fill-blank-input" autocomplete="off" />
      <div class="stage-actions">
        <button class="btn-primary" id="fill-submit">Kiểm tra</button>
      </div>
      <div id="fill-feedback"></div>
    `;

    const submit = () => {
      const input = stage.querySelector('#fill-input');
      const answer = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
      const correct = word.word.trim().toLowerCase();
      const isCorrect = answer === correct;
      const feedback = document.getElementById('fill-feedback');

      input.disabled = true;
      stage.querySelector('#fill-submit').disabled = true;

      if (isCorrect) {
        this.mark(word, true);
        feedback.innerHTML = `
          <p class="stage-meaning">✔ Chính xác!</p>
          <div class="stage-actions"><button class="btn-primary" id="fill-next">Từ tiếp theo</button></div>
        `;
      } else {
        feedback.innerHTML = `
          <p class="stage-meaning">✘ Sai rồi. Đáp án đúng: <strong>${word.word}</strong></p>
          <div class="stage-actions"><button class="btn-primary" id="fill-next">Từ tiếp theo</button></div>
        `;
      }
      document.getElementById('fill-next').addEventListener('click', () => this.advance());
    };

    stage.querySelector('#fill-submit').addEventListener('click', submit);
    stage.querySelector('#fill-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
    stage.querySelector('#fill-input').focus();
  },

  async renderReview(stage, word) {
    const isPhrase = word.word.includes(' ');
    const distractors = await api.randomDistractors(word.id, 3, word.word_type, isPhrase);
    const options = this.shuffle([{ id: word.id, meaning: word.meaning }, ...distractors]);

    stage.innerHTML = `
      <div class="stage-word">${word.word} <button class="speak-btn" data-speak="${word.word}">🔊</button></div>
      <div class="stage-phonetic">/${word.phonetic || ''}/ ${word.word_type ? `<span class="vocab-type">${word.word_type}</span>` : ''}</div>
      <div class="quiz-options">
        ${options.map((o, i) => `<button class="quiz-option" data-correct="${o.id === word.id}" data-index="${i}">${o.meaning}</button>`).join('')}
      </div>
      <div id="quiz-feedback"></div>
    `;
    stage.querySelector('[data-speak]').addEventListener('click', (e) => speak(e.target.dataset.speak));

    stage.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isCorrect = btn.dataset.correct === 'true';
        stage.querySelectorAll('.quiz-option').forEach((b) => (b.disabled = true));
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
          document.getElementById('quiz-feedback').innerHTML = `
            <div class="stage-example">→ ${word.example || ''}</div>
            <div class="stage-actions"><button class="btn-primary" id="review-next">Từ tiếp theo</button></div>
          `;
          document.getElementById('review-next').addEventListener('click', () => this.advance());
        } else {
          stage.querySelectorAll('.quiz-option').forEach((b) => {
            if (b.dataset.correct === 'true') b.classList.add('correct');
          });
          await api.markStudy(word.id, 'all', false);
          this.state.total = Math.max(0, this.state.total - 1);
          this.showRelearnPopup(word);
        }
      });
    });
  },

  showRelearnPopup(word) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>Học lại từ này</h3>
        <p class="stage-meaning">${word.word} — ${word.meaning}</p>
        ${word.example ? `<p class="stage-example">→ ${word.example}</p>` : ''}
        <p class="hint">Từ này đã được đưa về vòng học bình thường của lần nạp.</p>
        <button class="btn-primary" id="relearn-continue">Tiếp tục</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#relearn-continue').addEventListener('click', () => {
      overlay.remove();
      this.advance();
    });
  },

  renderTestQuestion(stage, word) {
    if (word.testQuestionType === 'quiz') this.renderTestQuiz(stage, word);
    else this.renderTestFill(stage, word);
  },

  async renderTestQuiz(stage, word) {
    const isPhrase = word.word.includes(' ');
    const distractors = await api.randomDistractors(word.id, 3, word.word_type, isPhrase);
    const options = this.shuffle([{ id: word.id, meaning: word.meaning }, ...distractors]);

    stage.innerHTML = `
      <div class="stage-word">${word.word} <button class="speak-btn" data-speak="${word.word}">🔊</button></div>
      <div class="stage-phonetic">/${word.phonetic || ''}/ ${word.word_type ? `<span class="vocab-type">${word.word_type}</span>` : ''}</div>
      <div class="quiz-options">
        ${options.map((o, i) => `<button class="quiz-option" data-correct="${o.id === word.id}" data-index="${i}">${o.meaning}</button>`).join('')}
      </div>
      <div id="quiz-feedback"></div>
    `;
    stage.querySelector('[data-speak]').addEventListener('click', (e) => speak(e.target.dataset.speak));

    stage.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';
        stage.querySelectorAll('.quiz-option').forEach((b) => (b.disabled = true));
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
          this.state.testCorrect += 1;
        } else {
          stage.querySelectorAll('.quiz-option').forEach((b) => {
            if (b.dataset.correct === 'true') b.classList.add('correct');
          });
        }
        document.getElementById('quiz-feedback').innerHTML = `
          <div class="stage-actions"><button class="btn-primary" id="test-next">Câu tiếp theo</button></div>
        `;
        document.getElementById('test-next').addEventListener('click', () => this.advanceTest());
      });
    });
  },

  renderTestFill(stage, word) {
    const blanked = this.blankOutWord(word.example, word.word);

    stage.innerHTML = `
      <div class="stage-phonetic">Gợi ý: ${word.meaning} (${word.word_type || ''})</div>
      <div class="fill-sentence">${blanked}</div>
      <input type="text" id="fill-input" class="fill-blank-input" autocomplete="off" />
      <div class="stage-actions">
        <button class="btn-primary" id="fill-submit">Kiểm tra</button>
      </div>
      <div id="fill-feedback"></div>
    `;

    const submit = () => {
      const input = stage.querySelector('#fill-input');
      const answer = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
      const correct = word.word.trim().toLowerCase();
      const isCorrect = answer === correct;
      const feedback = document.getElementById('fill-feedback');

      input.disabled = true;
      stage.querySelector('#fill-submit').disabled = true;
      if (isCorrect) this.state.testCorrect += 1;

      feedback.innerHTML = isCorrect
        ? `<p class="stage-meaning">✔ Chính xác!</p><div class="stage-actions"><button class="btn-primary" id="test-next">Câu tiếp theo</button></div>`
        : `<p class="stage-meaning">✘ Sai rồi. Đáp án đúng: <strong>${word.word}</strong></p><div class="stage-actions"><button class="btn-primary" id="test-next">Câu tiếp theo</button></div>`;
      document.getElementById('test-next').addEventListener('click', () => this.advanceTest());
    };

    stage.querySelector('#fill-submit').addEventListener('click', submit);
    stage.querySelector('#fill-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
    stage.querySelector('#fill-input').focus();
  },

  showTestResultPopup() {
    const { testCorrect, testTotal } = this.state;
    const percent = testTotal ? Math.round((testCorrect / testTotal) * 100) : 0;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3 class="neutral">Kết quả bài test</h3>
        <p class="stage-meaning">Đúng ${testCorrect}/${testTotal} câu (${percent}%)</p>
        <div class="stage-actions">
          <button class="btn-secondary" id="test-close">Đóng</button>
          <button class="btn-primary" id="test-retry">Làm lại</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#test-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#test-retry').addEventListener('click', () => {
      overlay.remove();
      this.loadTestBatch();
    });
  },

  blankOutWord(example, word) {
    if (!example) return '';
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const exactPattern = new RegExp(`\\b${escaped}\\b`, 'i');
    if (exactPattern.test(example)) {
      return example.replace(exactPattern, '____');
    }

    // Example may use an inflected form (emerged, studies, running...)
    // that the base dictionary word doesn't match exactly — fall back to
    // a prefix match so the answer still gets hidden.
    const inflectedPattern = new RegExp(`\\b${escaped}\\w*\\b`, 'i');
    return example.replace(inflectedPattern, '____');
  },

  shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },

  escape(str) {
    return (str || '').replace(/"/g, '&quot;');
  },
};
