const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');

router.get('/:skill', docsController.getSkillDoc);

module.exports = router;
