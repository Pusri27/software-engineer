const express = require('express');
const router = express.Router();
const { getComments, addComment, addReply, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:worklogId', protect, getComments);
router.post('/:worklogId', protect, addComment);
router.post('/:worklogId/reply/:commentId', protect, addReply);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
