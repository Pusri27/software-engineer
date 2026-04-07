const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  worklog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkLog',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Only 1 emoji per user per worklog (toggle/replace behavior)
  emoji: {
    type: String,
    enum: ['👍', '❤️', '🔥', '💡'],
    required: true,
  },
}, { timestamps: true });

// Enforce one reaction per user per worklog
reactionSchema.index({ worklog: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);
