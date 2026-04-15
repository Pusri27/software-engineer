const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  worklog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkLog',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true,
  },
  // parentId = null → top-level comment; parentId set → reply (1 level only)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
