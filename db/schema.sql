CREATE DATABASE IF NOT EXISTS webvocab
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE webvocab;

CREATE TABLE IF NOT EXISTS vocabulary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  phonetic VARCHAR(255),
  phonetic_ipa VARCHAR(255),
  word_type VARCHAR(50),
  meaning TEXT NOT NULL,
  example TEXT,
  import_date DATE NOT NULL,
  import_batch INT NOT NULL,
  batch_name VARCHAR(255) NULL,
  flashcard_done TINYINT(1) NOT NULL DEFAULT 0,
  quiz_done TINYINT(1) NOT NULL DEFAULT 0,
  fill_done TINYINT(1) NOT NULL DEFAULT 0,
  INDEX idx_import_batch (import_batch),
  INDEX idx_word (word),
  INDEX idx_flashcard (import_batch, flashcard_done),
  INDEX idx_quiz (import_batch, quiz_done),
  INDEX idx_fill (import_batch, fill_done)
);
