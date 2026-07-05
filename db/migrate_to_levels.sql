-- Migrates `vocabulary.status` (single shared flag) into 3 independent
-- per-mode progress flags, so finishing one study mode no longer marks
-- the word as done in the other two modes.
USE webvocab;

ALTER TABLE vocabulary
  ADD COLUMN flashcard_done TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN quiz_done TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN fill_done TINYINT(1) NOT NULL DEFAULT 0;

-- Best-effort carry-over: words already marked memorized count as done
-- everywhere, since we can't know which mode they were memorized in.
UPDATE vocabulary
SET flashcard_done = 1, quiz_done = 1, fill_done = 1
WHERE status = 'memorized';

ALTER TABLE vocabulary DROP INDEX idx_status;
ALTER TABLE vocabulary DROP COLUMN status;

ALTER TABLE vocabulary
  ADD INDEX idx_flashcard (import_date, flashcard_done),
  ADD INDEX idx_quiz (import_date, quiz_done),
  ADD INDEX idx_fill (import_date, fill_done);
