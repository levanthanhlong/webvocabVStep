-- Adds an optional custom name per import batch (e.g. "Từ vựng Unit 3"),
-- shown alongside "Lần N" in the batch dropdowns. NULL means unnamed —
-- existing batches are unaffected and keep showing just "Lần N — ngày".
USE webvocab;

ALTER TABLE vocabulary ADD COLUMN batch_name VARCHAR(255) NULL;
