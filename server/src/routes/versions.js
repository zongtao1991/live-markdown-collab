const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/document/:documentId', versionController.getVersionsByDocument);
router.get('/:id', versionController.getVersionById);

module.exports = router;
