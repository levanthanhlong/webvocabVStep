const fs = require('fs');
const path = require('path');

const SKILL_FILES = {
  reading: 'reading.md',
  listening: 'listening.md',
  writing: 'writing.md',
  speaking: 'speaking.md',
};

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function getSkillDoc(req, res) {
  const { skill } = req.params;
  const fileName = SKILL_FILES[skill];
  if (!fileName) {
    return res.status(400).json({ error: 'Kỹ năng không hợp lệ' });
  }

  const filePath = path.join(DOCS_DIR, fileName);
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  res.json({ skill, content });
}

module.exports = { getSkillDoc };
