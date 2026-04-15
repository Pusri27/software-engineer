const WorkLog = require("../models/WorkLog");
const LogHistory = require("../models/LogHistory");
const User = require("../models/User");
const { generateEmbedding, prepareTextForEmbedding } = require("../services/embeddingService");
const { processMediaUploads, extractMediaUrls, deleteFromSpaces } = require("../services/mediaService");
const aiService = require("../services/aiService");
const tagService = require("../services/tagService");

exports.addWorkLog = async (req, res) => {
  try {
    const { title, content, tag, media, collaborators } = req.body;

    // 🔥 Process uploads:
    // - Inline images in content (base64 → URL)
    // - Media attachments that are still base64 (fallback for legacy/special cases)
    // - Media with URLs (already uploaded) → keep as-is
    const { processedContent, processedMedia } = await processMediaUploads(content, media);

    const textToEmbed = prepareTextForEmbedding({ title, content: processedContent, tag });
    const embedding = await generateEmbedding(textToEmbed);

    const log = await WorkLog.create({
      title, 
      content: processedContent, 
      tag, 
      media: processedMedia, 
      collaborators: collaborators || [], 
      user: req.user._id, 
      embedding
    });
    res.status(201).json(log);

    // 🤖 Auto-tag (fire-and-forget) — only if user provided < 2 tags
    if (!tag || tag.length < 2) {
      tagService.generateTags(title, processedContent).then(aiTags => {
        if (aiTags.length > 0) {
          WorkLog.findByIdAndUpdate(log._id, { tag: aiTags }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editWorkLog = async (req, res) => {
  try {
    const log = await WorkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Not found" });

    // 🔥 Process any new base64 uploads in edited content
    const { processedContent, processedMedia } = await processMediaUploads(
      req.body.content || log.content,
      req.body.media || log.media
    );

    // Regenerate embedding with updated content
    const textToEmbed = prepareTextForEmbedding({
      title: req.body.title || log.title,
      content: processedContent,
      tag: req.body.tag || log.tag
    });
    const embedding = await generateEmbedding(textToEmbed);

    const updated = await WorkLog.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        content: processedContent,
        media: processedMedia,
        embedding 
      },
      { new: true }
    );
    
    // await LogHistory.create({
    //   message: `Edited post: ${log.title}`,
    //   user: req.user._id
    // });

    await LogHistory.create({
      message: `Edited post: ${log.title}`,
      user: req.user._id,
      snapshot: {
        title: updated.title,
        content: updated.content,
        tag: updated.tag,
        media: updated.media,
        datetime: new Date(),
      }
    });
    res.json(updated);

    // 🤖 Auto-tag (fire-and-forget) — only if edited result has < 2 tags
    const finalTags = req.body.tag || log.tag || [];
    if (finalTags.length < 2) {
      tagService.generateTags(updated.title, processedContent).then(aiTags => {
        if (aiTags.length > 0) {
          WorkLog.findByIdAndUpdate(updated._id, { tag: aiTags }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteWorkLog = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id);

    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (worklog.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this worklog" });
    }

    // 🔥 Delete all associated media from DO Spaces
    const mediaUrls = extractMediaUrls(worklog.content, worklog.media);
    await Promise.all(mediaUrls.map(url => deleteFromSpaces(url)));

    await worklog.deleteOne();
    res.status(200).json({ message: "WorkLog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addVersion = async (req, res) => {
  try {
    const { message } = req.body;
    const log = await WorkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Not found" });

    // const version = await LogHistory.create({
    //   message,
    //   user: req.user._id
    // });

    const version = await LogHistory.create({
      message,
      user: req.user._id,
      snapshot: {
        title: log.title,
        content: log.content,
        tag: log.tag,
        media: log.media,
        collaborators: log.collaborators,
        datetime: new Date(),
      }
    });

    log.log_history.push(version._id);
    await log.save();
    res.status(201).json({
      message: "Version added",
      version,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVersions = async (req, res) => {
  try {
    // Cari WorkLog berdasarkan ID
    const worklog = await WorkLog.findById(req.params.id).populate("log_history");
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    // Validasi agar hanya owner atau collaborator yang bisa melihat versi
    const isOwner = worklog.user.toString() === req.user._id.toString();
    const isCollaborator = worklog.collaborators.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "You are not allowed to view these versions" });
    }

    // Ambil log history dengan data user
    const versions = await LogHistory.find({ _id: { $in: worklog.log_history } })
      .populate("user", "name email division profile_photo")
      .sort({ datetime: -1 });

    res.status(200).json({ worklog_id: worklog._id, title: worklog.title, versions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE LOG HISTORY
exports.getLogHistoryById = async (req, res) => {
  try {
    const history = await LogHistory.findById(req.params.id);

    if (!history) {
      return res.status(404).json({ message: "LogHistory not found" });
    }

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    const collaborator = await User.findOne({ email });
    if (!collaborator) return res.status(404).json({ message: "User not found" });

    const log = await WorkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "WorkLog not found" });

    // Check if user is the owner
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owner can add collaborators" });
    }

    // Add to collaborators array if not already there
    if (!log.collaborators.includes(collaborator._id)) {
      log.collaborators.push(collaborator._id);
      await log.save();
    }

    res.json({ 
      message: "Collaborator added with edit access", 
      log 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET Collaborators
exports.getCollaborators = async (req, res) => {
  try {
    const log = await WorkLog.findById(req.params.id).populate(
      "collaborators",
      "name email division role profile_photo"
    );
    if (!log) return res.status(404).json({ message: "WorkLog not found" });

    res.json({
      message: "Collaborators retrieved successfully",
      collaborators: log.collaborators,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE Collaborator
exports.deleteCollaborator = async (req, res) => {
  try {
    const { collaboratorId } = req.params;
    const log = await WorkLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: "WorkLog not found" });

    // Cek apakah user pemilik log
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Hapus kolaborator
    log.collaborators = log.collaborators.filter(
      (id) => id.toString() !== collaboratorId
    );
    await log.save();

    res.json({
      message: "Collaborator removed successfully",
      collaborators: log.collaborators,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Search & Filter worklogs dengan query parameters (Division-aware + Pagination)
exports.filterWorkLogs = async (req, res) => {
  try {
    const { search, tag, from, to, page = 1, limit = 10 } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    // Get user division from JWT token (already authenticated via protect middleware)
    const userDivision = req.user?.division;

    if (!userDivision) {
      console.warn('⚠️ filterWorkLogs - No user division found!');
    }

    // ── 1. Resolve division-scoped user IDs once ──────────────────────
    // This replaces the old approach of fetching all worklogs then
    // filtering by populate match (which was done in memory).
    const divisionUsers = await User.find({ division: userDivision }).select('_id').lean();
    const divisionUserIds = divisionUsers.map(u => u._id);

    // Base filter: only worklogs by users in the same division
    let filter = { user: { $in: divisionUserIds } };

    // ── 2. Search: title / content (text index) or author name ───────
    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: 'i' },
        division: userDivision
      }).select('_id').lean();

      const matchingUserIds = matchingUsers.map(u => u._id);

      const searchConditions = [
        { title:   { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
      if (matchingUserIds.length > 0) {
        searchConditions.push({ user: { $in: matchingUserIds } });
      }

      // Combine division filter with search conditions
      filter = {
        user: { $in: divisionUserIds },
        $or: searchConditions,
      };
    }

    // ── 3. Tag filter ─────────────────────────────────────────────────
    if (tag) {
      const tags = Array.isArray(tag)
        ? tag
        : tag.split(',').map(t => t.trim().replace(/^#+/, '').toLowerCase());
      filter.tag = { $in: tags.map(t => new RegExp(`^${t}$`, 'i')) };
    }

    // ── 4. Date range filter ──────────────────────────────────────────
    if (from || to) {
      filter.datetime = {};
      if (from) filter.datetime.$gte = new Date(from);
      if (to)   filter.datetime.$lte = new Date(to);
    }

    // ── 5. Run query + count in parallel ─────────────────────────────
    // DB handles pagination — no more .slice() in JS
    const [logs, totalDocs] = await Promise.all([
      WorkLog.find(filter)
        .populate('user',          'name email division profile_photo')
        .populate('collaborators', 'name email division profile_photo')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WorkLog.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages  = Math.ceil(totalDocs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      worklogs: logs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDocs,
        hasNextPage,
        hasPrevPage,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET detail worklog by ID
exports.getWorkLogById = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id)
      .populate("user", "name email division profile_photo join_date")
      .populate("collaborators", "name email division profile_photo");
    
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }
    
    res.json(worklog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/worklogs/my-stats — personal worklog activity statistics
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // ── 1. All user's own worklogs ────────────────────────────────────
    const allLogs = await WorkLog.find({ user: userId })
      .select('title content tag datetime createdAt')
      .sort({ datetime: -1 })
      .lean();

    const total = allLogs.length;

    // ── 2. Daily counts — last 7 days ─────────────────────────────────
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const dailyCounts = days.map(day => {
      const label = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const count = allLogs.filter(log => {
        const logDate = new Date(log.datetime || log.createdAt);
        return (
          logDate.getFullYear() === day.getFullYear() &&
          logDate.getMonth() === day.getMonth() &&
          logDate.getDate() === day.getDate()
        );
      }).length;
      return { date: label, count };
    });

    // ── 3. Top 5 tags ─────────────────────────────────────────────────
    const tagCounts = {};
    allLogs.forEach(log => {
      (log.tag || []).forEach(t => {
        const clean = t.replace(/^#+/, '').toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // ── 4. Total word count ───────────────────────────────────────────
    const totalWords = allLogs.reduce((sum, log) => {
      const text = (log.content || '')
        .replace(/<[^>]*>/g, ' ')
        .trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);

    // ── 5. Streak — consecutive days with at least 1 worklog ─────────
    let streak = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const hasLog = allLogs.some(log => {
        const logDate = new Date(log.datetime || log.createdAt);
        return (
          logDate.getFullYear() === checkDate.getFullYear() &&
          logDate.getMonth() === checkDate.getMonth() &&
          logDate.getDate() === checkDate.getDate()
        );
      });
      if (!hasLog) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    res.json({
      total,
      totalWords,
      streak,
      dailyCounts,
      topTags,
    });
  } catch (error) {
    console.error('❌ getMyStats error:', error.message);
    res.status(500).json({ message: error.message });
  }
};


// POST /api/worklogs/summarize — AI-generated summary of worklogs sent from frontend
// Frontend sends exactly the worklogs visible on screen — no extra DB query needed
exports.summarizeWorkLogs = async (req, res) => {
  try {
    const { worklogs } = req.body;

    if (!worklogs || !Array.isArray(worklogs) || worklogs.length === 0) {
      return res.status(400).json({ message: 'No worklogs to summarize.' });
    }

    // Build a compact, clean context string (base64 already stripped by frontend)
    const context = worklogs.map((log, i) => {
      const date = log.date
        ? new Date(log.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      const tags = (log.tag || []).join(', ');
      const content = (log.content || '').substring(0, 250);
      return [
        `${i + 1}. "${log.title}"${date ? ` [${date}]` : ''}${tags ? ` (${tags})` : ''}`,
        content ? `   ${content}` : null
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    // English instruction in both system and user message
    const systemPrompt = `You are a team worklog summarizer assistant that ONLY responds in English.
MANDATORY RULES:
- ALWAYS use English. NEVER use any other language.
- Write a SHORT summary of maximum 120 words.
- Focus on main themes, achievements, and team activities.
- Use a professional and positive tone.
- Do not mention specific names, focus on activities.`;

    const userMessage = `[ENGLISH ONLY] Write a short summary in English of the following ${worklogs.length} team worklogs:\n\n${context}\n\nSummary (in English):`;

    const summary = await aiService.generateResponse(systemPrompt, userMessage);

    res.json({ summary, totalLogs: worklogs.length });
  } catch (error) {
    console.error('❌ summarizeWorkLogs error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/worklogs/:id/related — find semantically similar worklogs via vector search
exports.getRelatedWorkLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userDivision = req.user?.division;

    // Fetch target worklog WITH its embedding (select: false by default)
    const target = await WorkLog.findById(id).select('+embedding').lean();
    if (!target) return res.status(404).json({ message: 'WorkLog not found' });
    if (!target.embedding || target.embedding.length === 0) {
      return res.json({ related: [] });
    }

    // Vector search for semantically similar worklogs
    const results = await WorkLog.aggregate([
      {
        $vectorSearch: {
          index: 'worklog_vector_index',
          path: 'embedding',
          queryVector: target.embedding,
          numCandidates: 50,
          limit: 6,
        }
      },
      { $match: { _id: { $ne: target._id } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [{ $project: { name: 1, division: 1, profile_photo: 1 } }]
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      { $match: { 'userInfo.division': userDivision } },
      {
        $project: {
          _id: 1,
          title: 1,
          tag: 1,
          datetime: 1,
          score: { $meta: 'vectorSearchScore' },
          userName: '$userInfo.name',
          userPhoto: '$userInfo.profile_photo',
        }
      },
      { $limit: 4 }
    ]);

    res.json({ related: results });
  } catch (error) {
    console.error('❌ getRelatedWorkLogs error:', error.message);
    res.json({ related: [] }); // graceful fallback
  }
};

