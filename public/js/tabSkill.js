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
    container.innerHTML = '<p class="stage-empty">Đang tải...</p>';

    const res = await fetch(`/api/docs/${this.state.skill}`);
    const { content } = await res.json();
    const trimmed = content.trim();

    container.innerHTML = trimmed
      ? this.renderMarkdown(trimmed)
      : '<p class="stage-empty">Chưa có nội dung. Hãy thêm vào file tương ứng trong thư mục docs/.</p>';
  },

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  // Minimal renderer for the plain-text/markdown-ish notes users paste into
  // docs/*.md — headings (# / ##), ALL-CAPS tip lines, **bold**, bullet
  // lines (-, •, ✔️, 👉, 📌...), and ⸻/--- dividers. Not a full markdown
  // spec, just enough for these study notes to read like formatted text
  // instead of raw source.
  inlineFormat(text) {
    return this.escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>');
  },

  renderMarkdown(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let inQuote = false;

    const closeList = () => {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    };
    const closeQuote = () => {
      if (inQuote) {
        html += '</blockquote>';
        inQuote = false;
      }
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        closeList();
        closeQuote();
        return;
      }

      if (/^(⸻+|-{3,}|_{3,})$/.test(line)) {
        closeList();
        closeQuote();
        html += '<hr>';
        return;
      }

      const quoteMatch = line.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        closeList();
        if (!inQuote) {
          html += '<blockquote>';
          inQuote = true;
        }
        html += `<p>${this.inlineFormat(quoteMatch[1])}</p>`;
        return;
      }
      closeQuote();

      const headerMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headerMatch) {
        closeList();
        const level = headerMatch[1].length + 2;
        html += `<h${level}>${this.inlineFormat(headerMatch[2])}</h${level}>`;
        return;
      }

      // A line that's entirely **bold** (start to end) is used as a
      // pseudo-heading in these notes — a partial-bold line like
      // "**Term:** explanation" doesn't match since text follows the `**`.
      // h6 so it nests below any #/##/### section headings that surround it
      // instead of competing with them at the same visual level.
      const fullBoldMatch = line.match(/^\*\*(.+)\*\*$/);
      if (fullBoldMatch) {
        closeList();
        html += `<h6>${this.inlineFormat(fullBoldMatch[1])}</h6>`;
        return;
      }

      // "(VN: ...)" translation lines sit right under the bullet they
      // explain — keep the list open and add them as a muted sub-item
      // instead of breaking out into a paragraph between bullets.
      const vnNoteMatch = line.match(/^\(VN:\s*(.*)\)$/);
      if (vnNoteMatch && inList) {
        html += `<li class="skill-vn-note">${this.inlineFormat(vnNoteMatch[1])}</li>`;
        return;
      }

      const bulletMatch = line.match(/^(->|-|•|✔️|👉|📌|⚡️|❌|✅|→)\s*(.*)$/);
      if (bulletMatch) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const marker = bulletMatch[1] === '-' || bulletMatch[1] === '•' ? '' : `${bulletMatch[1] === '->' ? '→' : bulletMatch[1]} `;
        html += `<li>${marker}${this.inlineFormat(bulletMatch[2])}</li>`;
        return;
      }

      // ALL-CAPS line reads like a heading in these notes (e.g. "TIP 1: ...").
      // Compare against its own uppercase form (Unicode-aware) rather than an
      // [A-Z] range, since Vietnamese diacritic letters aren't ordered by
      // case in a simple code-point range.
      const hasLetter = /\p{L}/u.test(line);
      if (hasLetter && line.length < 90 && line === line.toUpperCase()) {
        closeList();
        html += `<h3>${this.inlineFormat(line)}</h3>`;
        return;
      }

      closeList();
      html += `<p>${this.inlineFormat(line)}</p>`;
    });

    closeList();
    closeQuote();
    return html;
  },
};
