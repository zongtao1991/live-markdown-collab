const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/document/:documentId', commentController.getCommentsByDocument);
router.post('/document/:documentId', commentController.createComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
