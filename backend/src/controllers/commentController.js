const Comment = require('../models/Comment');

// GET /api/comments/:worklogId — fetch all comments for a worklog
exports.getComments = async (req, res) => {
  try {
    const { worklogId } = req.params;

    const all = await Comment.find({ worklog: worklogId })
      .populate('user', 'name profile_photo profilePicture division')
      .sort({ createdAt: 1 })
      .lean();

    // Separate top-level and replies
    const topLevel = all.filter(c => !c.parentId);
    const replies = all.filter(c => c.parentId);

    // Attach replies to their parents
    const tree = topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentId?.toString() === comment._id.toString()),
    }));

    res.json({ comments: tree, total: all.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/comments/:worklogId — add a top-level comment
exports.addComment = async (req, res) => {
  try {
    const { worklogId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const comment = await Comment.create({
      worklog: worklogId,
      user: req.user._id,
      content: content.trim(),
      parentId: null,
    });

    const populated = await comment.populate('user', 'name profile_photo profilePicture division');

    res.status(201).json({ comment: { ...populated.toObject(), replies: [] } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/comments/:worklogId/reply/:commentId — reply to a comment
exports.addReply = async (req, res) => {
  try {
    const { worklogId, commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const parent = await Comment.findById(commentId);
    if (!parent) return res.status(404).json({ message: 'Parent comment not found' });

    const reply = await Comment.create({
      worklog: worklogId,
      user: req.user._id,
      content: content.trim(),
      parentId: commentId,
    });

    const populated = await reply.populate('user', 'name profile_photo profilePicture division');
    res.status(201).json({ comment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/comments/:commentId — delete own comment (or any if admin)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // If deleting a top-level comment, also delete its replies
    if (!comment.parentId) {
      await Comment.deleteMany({ parentId: commentId });
    }

    await Comment.deleteOne({ _id: commentId });
    res.json({ message: 'Comment deleted', commentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
