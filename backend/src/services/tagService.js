/**
 * Tag Service — AI-powered automatic tag generation for worklogs
 *
 * Generates 3–5 relevant tags based on worklog title + content.
 * Uses a lean prompt (low tokens) to keep latency minimal.
 * Fire-and-forget pattern: caller should not await or block on this.
 */
const aiService = require('./aiService');

/**
 * Generate tags for a worklog using AI.
 * @param {string} title - Worklog title
 * @param {string} content - Raw HTML or plain text content (first 400 chars used)
 * @returns {Promise<string[]>} - Array of lowercase tags without '#', e.g. ['api', 'backend', 'bugfix']
 */
async function generateTags(title, content) {
  try {
    // Strip HTML tags from content for cleaner input
    const plainContent = (content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 400);

    const systemPrompt = `You are a tagging assistant. Extract 3-5 concise topic tags from the given worklog.
Rules:
- Output ONLY a JSON array of strings, e.g. ["api", "backend", "bugfix"]
- Tags must be lowercase, no spaces (use hyphens), no hashtags
- Max 5 tags, min 3 tags
- Focus on technical topics, not generic words like "work" or "update"
- No explanation, no markdown, just the JSON array`;

    const userMessage = `Worklog title: "${title}"
Content: "${plainContent}"

Extract 3-5 tags:`;

    const response = await aiService.generateResponse(systemPrompt, userMessage);

    // Parse the JSON array from AI response
    // Handle cases where AI wraps in markdown code blocks
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const tags = JSON.parse(cleaned);

    if (!Array.isArray(tags)) return [];

    // Sanitize: lowercase, replace spaces with hyphens, max 30 chars each
    return tags
      .filter(t => typeof t === 'string' && t.length > 0)
      .map(t => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 30))
      .filter(t => t.length > 1)
      .slice(0, 5);

  } catch (err) {
    console.warn('⚠️ Auto-tagging failed (non-blocking):', err.message);
    return [];
  }
}

module.exports = { generateTags };
