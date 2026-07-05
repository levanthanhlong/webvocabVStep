-- Migrates grouping from "import_date" (calendar day) to "import_batch"
-- (one number per import action), so a day with many separate imports no
-- longer gets lumped into a single huge list.
--
-- We have no record of individual past import actions, only their date,
-- so each distinct existing import_date becomes one retroactive batch
-- number (in chronological order). Every import from now on gets its own
-- new batch number regardless of date.
USE webvocab;

ALTER TABLE vocabulary ADD COLUMN import_batch INT NULL;

UPDATE vocabulary v
JOIN (
  SELECT import_date, DENSE_RANK() OVER (ORDER BY import_date) AS batch_no
  FROM (SELECT DISTINCT import_date FROM vocabulary) AS d
) AS b ON v.import_date = b.import_date
SET v.import_batch = b.batch_no;

ALTER TABLE vocabulary MODIFY COLUMN import_batch INT NOT NULL;

ALTER TABLE vocabulary DROP INDEX idx_import_date;
ALTER TABLE vocabulary DROP INDEX idx_flashcard;
ALTER TABLE vocabulary DROP INDEX idx_quiz;
ALTER TABLE vocabulary DROP INDEX idx_fill;

ALTER TABLE vocabulary
  ADD INDEX idx_import_batch (import_batch),
  ADD INDEX idx_flashcard (import_batch, flashcard_done),
  ADD INDEX idx_quiz (import_batch, quiz_done),
  ADD INDEX idx_fill (import_batch, fill_done);
