const Reaction = require('../models/Reaction');

const VALID_EMOJIS = ['👍', '❤️', '🔥', '💡'];

// GET /api/reactions/:worklogId — get all reactions grouped by emoji
exports.getReactions = async (req, res) => {
  try {
    const { worklogId } = req.params;
    const userId = req.user._id;

    const reactions = await Reaction.find({ worklog: worklogId }).lean();

    // Group by emoji with counts
    const grouped = {};
    VALID_EMOJIS.forEach(e => { grouped[e] = { count: 0, reacted: false }; });

    reactions.forEach(r => {
      if (grouped[r.emoji] !== undefined) {
        grouped[r.emoji].count++;
        if (r.user.toString() === userId.toString()) {
          grouped[r.emoji].reacted = true;
        }
      }
    });

    // Also return what emoji the current user has (if any), for single-emoji mode
    const myReaction = reactions.find(r => r.user.toString() === userId.toString());

    res.json({
      reactions: grouped,
      myEmoji: myReaction?.emoji || null,
      total: reactions.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reactions/:worklogId — toggle or replace reaction
// Body: { emoji: '👍' }
// Behavior: 
//   - No existing reaction → create
//   - Same emoji as existing → delete (toggle off)
//   - Different emoji → update to new emoji
exports.toggleReaction = async (req, res) => {
  try {
    const { worklogId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!VALID_EMOJIS.includes(emoji)) {
      return res.status(400).json({ message: 'Invalid emoji. Must be one of: ' + VALID_EMOJIS.join(' ') });
    }

    const existing = await Reaction.findOne({ worklog: worklogId, user: userId });

    if (!existing) {
      // Create new reaction
      await Reaction.create({ worklog: worklogId, user: userId, emoji });
      return res.json({ action: 'added', emoji });
    }

    if (existing.emoji === emoji) {
      // Toggle off — remove reaction
      await Reaction.deleteOne({ _id: existing._id });
      return res.json({ action: 'removed', emoji });
    }

    // Replace with new emoji
    existing.emoji = emoji;
    await existing.save();
    return res.json({ action: 'replaced', emoji, previous: existing.emoji });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
