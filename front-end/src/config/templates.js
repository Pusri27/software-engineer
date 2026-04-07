/**
 * Worklog Templates
 * Pre-defined templates for common worklog types.
 * Content is in HTML format compatible with TipTap editor.
 */

export const WORKLOG_TEMPLATES = [
  {
    id: "daily-report",
    name: "Daily Report",
    description: "Standard end-of-day summary",
    icon: "📋",
    defaultTitle: "Daily Report — ",
    defaultTags: ["daily-report", "daily"],
    content: `<h2>What I Accomplished Today</h2>
<ul>
  <li>...</li>
  <li>...</li>
</ul>

<h2>Work in Progress</h2>
<ul>
  <li>...</li>
</ul>

<h2>Plan for Tomorrow</h2>
<ul>
  <li>...</li>
</ul>

<h2>Blockers / Issues</h2>
<p>None / ...</p>`
  },
  {
    id: "sprint-review",
    name: "Sprint Review",
    description: "End of sprint summary & retrospective",
    icon: "🏁",
    defaultTitle: "Sprint Review — Sprint #",
    defaultTags: ["sprint-review", "sprint"],
    content: `<h2>Sprint Goal</h2>
<p>...</p>

<h2>Completed Stories / Tasks</h2>
<ul>
  <li>...</li>
  <li>...</li>
</ul>

<h2>Not Completed (Carried Over)</h2>
<ul>
  <li>...</li>
</ul>

<h2>Velocity</h2>
<p>Planned: ... points | Completed: ... points</p>

<h2>Retrospective</h2>
<h3>What went well</h3>
<ul><li>...</li></ul>
<h3>What needs improvement</h3>
<ul><li>...</li></ul>
<h3>Action items</h3>
<ul><li>...</li></ul>`
  },
  {
    id: "incident-report",
    name: "Incident Report",
    description: "Document a production issue or outage",
    icon: "🚨",
    defaultTitle: "Incident Report — ",
    defaultTags: ["incident", "post-mortem"],
    content: `<h2>Incident Summary</h2>
<p><strong>Severity:</strong> P1 / P2 / P3</p>
<p><strong>Status:</strong> Resolved / Ongoing</p>
<p><strong>Duration:</strong> Start → End</p>

<h2>What Happened</h2>
<p>...</p>

<h2>Impact</h2>
<p>Users affected: ... | Services affected: ...</p>

<h2> Root Cause</h2>
<p>...</p>

<h2>Resolution Steps</h2>
<ol>
  <li>...</li>
  <li>...</li>
</ol>

<h2>Prevention (Action Items)</h2>
<ul>
  <li>...</li>
</ul>`
  },
  {
    id: "knowledge-transfer",
    name: "Knowledge Transfer",
    description: "Document a system, process, or key knowledge",
    icon: "📚",
    defaultTitle: "Knowledge Transfer: ",
    defaultTags: ["knowledge-transfer", "documentation"],
    content: `<h2>Purpose</h2>
<p>What is this document about and why it matters.</p>

<h2>Overview</h2>
<p>High-level explanation of the system / process / concept.</p>

<h2>Step-by-Step Guide</h2>
<ol>
  <li>...</li>
  <li>...</li>
  <li>...</li>
</ol>

<h2>Common Pitfalls / Gotchas</h2>
<ul>
  <li>...</li>
</ul>

<h2>References & Resources</h2>
<ul>
  <li>...</li>
</ul>

<h2>Contact Person</h2>
<p>For questions, reach out to: ...</p>`
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Capture decisions and action items from a meeting",
    icon: "🗣️",
    defaultTitle: "Meeting Notes — ",
    defaultTags: ["meeting", "notes"],
    content: `<h2>Meeting Details</h2>
<p><strong>Date:</strong> ...</p>
<p><strong>Attendees:</strong> ...</p>
<p><strong>Facilitator:</strong> ...</p>

<h2>Agenda</h2>
<ol>
  <li>...</li>
  <li>...</li>
</ol>

<h2>Discussion Points</h2>
<h3>Topic 1</h3>
<p>...</p>
<h3>Topic 2</h3>
<p>...</p>

<h2>Decisions Made</h2>
<ul>
  <li>...</li>
</ul>

<h2>Action Items</h2>
<ul>
  <li>[ ] Task — Owner — Due Date</li>
  <li>[ ] Task — Owner — Due Date</li>
</ul>

<h2>Next Meeting</h2>
<p>...</p>`
  }
];

export const SCRATCH_OPTION = {
  id: "scratch",
  name: "Start from scratch",
  description: "Blank canvas, you decide everything",
  icon: "✏️",
};
