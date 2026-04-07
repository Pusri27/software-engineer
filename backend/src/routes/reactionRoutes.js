const express = require('express');
const router = express.Router();
const { getReactions, toggleReaction } = require('../controllers/reactionController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:worklogId', protect, getReactions);
router.post('/:worklogId', protect, toggleReaction);

module.exports = router;
