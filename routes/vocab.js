const express = require('express');
const router = express.Router();
const vocabController = require('../controllers/vocabController');

router.post('/import', vocabController.importVocab);
router.get('/batches', vocabController.listImportBatches);
router.get('/by-batch/:batch', vocabController.listByImportBatch);
router.post('/by-batch/:batch/reset', vocabController.resetImportBatch);
router.delete('/by-batch/:batch', vocabController.deleteImportBatch);
router.get('/study/batch', vocabController.studyBatch);
router.get('/review/batch', vocabController.reviewBatch);
router.post('/study/mark', vocabController.markStudy);
router.post('/bulk-delete', vocabController.bulkDeleteVocab);
router.get('/random', vocabController.randomDistractors);
router.get('/suggest', vocabController.suggestWords);
router.get('/', vocabController.listVocab);
router.put('/:id', vocabController.updateVocab);
router.delete('/:id', vocabController.deleteVocab);

module.exports = router;
