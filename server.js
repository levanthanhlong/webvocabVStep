require('dotenv').config();
const express = require('express');
const path = require('path');
const vocabRoutes = require('./routes/vocab');
const docsRoutes = require('./routes/docs');
const dictionaryRoutes = require('./routes/dictionary');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/vocab', vocabRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/dictionary', dictionaryRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ' });
});

app.listen(PORT, () => {
  console.log(`webvocab đang chạy tại http://localhost:${PORT}`);
});
