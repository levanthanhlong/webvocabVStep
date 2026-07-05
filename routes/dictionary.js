const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionaryController');

router.get('/:word', dictionaryController.lookupWord);

module.exports = router;
