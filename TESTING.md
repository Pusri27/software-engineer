# NEBWORK — Testing Documentation

> **Application:** NEBWORK — Knowledge Relay & Work Log Management System  
> **Stack:** Node.js + Express (Backend) · React + Vite (Frontend) · MongoDB Atlas  
> **Test Framework:** Jest + Supertest (Backend) · Manual / Postman (API) · Browser (Frontend)  
> **Last Updated:** April 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Environment Setup](#2-environment-setup)
3. [Running Automated Tests](#3-running-automated-tests)
4. [Backend API Test Cases](#4-backend-api-test-cases)
   - [4.1 Authentication](#41-authentication)
   - [4.2 Admin — Employee Management](#42-admin--employee-management)
   - [4.3 Work Logs (CRUD)](#43-work-logs-crud)
   - [4.4 Work Log — Versions](#44-work-log--versions)
   - [4.5 Work Log — Collaborators](#45-work-log--collaborators)
   - [4.6 Chatbot (AI + RAG)](#46-chatbot-ai--rag)
   - [4.7 Reactions](#47-reactions)
   - [4.8 Comments](#48-comments)
   - [4.9 File Upload](#49-file-upload)
5. [Frontend Manual Test Cases](#5-frontend-manual-test-cases)
   - [5.1 Login Page](#51-login-page)
   - [5.2 Dashboard / Feed](#52-dashboard--feed)
   - [5.3 WorkLog Editor](#53-worklog-editor)
   - [5.4 Chatbot Page](#54-chatbot-page)
   - [5.5 Profile Page](#55-profile-page)
   - [5.6 My Stats Page](#56-my-stats-page)
   - [5.7 Admin Panel](#57-admin-panel)
   - [5.8 Password Reset Flow](#58-password-reset-flow)
6. [Security & Middleware Tests](#6-security--middleware-tests)
7. [AI / Chatbot Integration Tests](#7-ai--chatbot-integration-tests)
8. [Embedding & Vector Search Tests](#8-embedding--vector-search-tests)
9. [Error Handling & Edge Cases](#9-error-handling--edge-cases)
10. [Test Results & Reports](#10-test-results--reports)

---

## 1. Overview

NEBWORK is a company knowledge-relay web application. Employees post daily work logs enriched with media, tags, and collaborators. An AI chatbot answers questions about the team's work using Retrieval-Augmented Generation (RAG) over the work log database.

### Architecture Under Test

```
Browser (React/Vite : 8080)
        │
        ▼
Backend API (Express : 5000)
        │
        ├── MongoDB Atlas (data)
        ├── OpenRouter API (AI responses — openai/gpt-5.3-chat)
        └── OpenRouter Embeddings (openai/text-embedding-3-small)
```

### Test Categories

| Category | Tool | Scope |
|---|---|---|
| Unit / Integration (API) | Jest + Supertest | Backend routes & controllers |
| Manual API | Postman | All REST endpoints |
| Manual UI | Browser | React pages & user flows |
| Security | Manual | Auth, rate-limit, CORS |
| AI / RAG | Manual + Postman | Chatbot accuracy & fallback |

---

## 2. Environment Setup

### 2.1 Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| MongoDB Atlas | M0 Free Tier or above |
| OpenRouter Account | API Key required |

### 2.2 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy the template below)
# Then run the dev server
npm run dev
```

**Required `.env` variables:**

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/
JWT_SECRET=<your-secret-key>
PORT=5000
NODE_ENV=development

# AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-...
MODEL_ACCESS_KEY=sk-or-v1-...   # same key, used as fallback

# Storage (placeholder for local dev)
OS_ACCESS_KEY=placeholder_key
OS_SECRET_KEY=placeholder_secret
OS_BUCKET=placeholder_bucket
OS_ENDPOINT=http://localhost

# Email (disable for local dev)
DISABLE_EMAIL=true
EMBEDDING_API_KEY=<openai-or-unused>
```

### 2.3 Frontend Setup

```bash
cd front-end
npm install
npm run dev
# → Accessible at http://localhost:8080
```

### 2.4 Atlas Vector Search Index

The chatbot requires a MongoDB Atlas Vector Search index on the `worklogs` collection:

- **Index name:** `worklog_vector_index`
- **Field:** `embedding`
- **Dimensions:** `1536`
- **Similarity:** `cosine`

```json
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 1536,
    "similarity": "cosine"
  }]
}
```

After creating the index, run the embedding generation script:

```bash
cd backend
node src/scripts/checkEmbeddings.js
```

---

## 3. Running Automated Tests

### 3.1 Run All Tests

```bash
cd backend
npm test
```

Output is saved to `backend/reports/test-results.json`.

### 3.2 Run a Specific Test File

```bash
# Authentication & Admin tests
npx jest src/test/auth.test.js --runInBand

# WorkLog CRUD tests
npx jest src/test/worklog.test.js --runInBand

# Version history tests
npx jest src/test/version.test.js --runInBand

# Collaborator tests
npx jest src/test/collaborator.test.js --runInBand
```

> **`--runInBand`** flag is required — tests share a MongoDB connection and must run sequentially.

### 3.3 Test Environment Notes

- `worklog.test.js`, `version.test.js`, and `collaborator.test.js` use **MongoDB in-memory server** — no Atlas connection needed.
- `auth.test.js` connects to the real Atlas test database (`MONGO_URI_TEST` env var, falls back to `MONGO_URI`).
- Set `DISABLE_EMAIL=true` to skip nodemailer during tests.

---

## 4. Backend API Test Cases

Base URL (local): `http://localhost:5000`

### 4.1 Authentication

#### TC-AUTH-01 — User Login

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Test File** | `auth.test.js` |

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Responses:**

| Scenario | Status | Response Body |
|---|---|---|
| Valid credentials | `200` | `{ token: "...", user: { id, name, email, role } }` |
| Wrong password | `401` | `{ message: "Invalid credentials" }` |
| User not found | `401` | `{ message: "Invalid credentials" }` |
| Missing fields | `400` | Validation error |
| > 5 attempts / 15 min | `429` | Rate limit exceeded message |

---

#### TC-AUTH-02 — Logout

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/logout` |

**Expected:** `200 OK` with `{ message: "..." }`.

---

#### TC-AUTH-03 — Get Profile

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/auth/profile` |
| **Auth** | Bearer token required |

**Expected:**

| Scenario | Status |
|---|---|
| Valid token | `200` with user object |
| Missing token | `401` |
| Expired token | `401` |

---

#### TC-AUTH-04 — Update Profile

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/auth/profile` |
| **Auth** | Bearer token required |

**Request:**
```json
{
  "name": "Updated Name",
  "division": "Engineering"
}
```

**Expected:** `200` with updated user object.

---

#### TC-AUTH-05 — Forgot Password

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/forgot-password` |
| **Rate Limit** | 5 requests / hour |

**Request:**
```json
{ "email": "user@example.com" }
```

**Expected:**

| Scenario | Status |
|---|---|
| Registered email | `200` with message |
| Non-existent email | `200` (no enumeration) |
| Rate limit exceeded | `429` |

---

#### TC-AUTH-06 — Reset Password

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/reset-password` |
| **Rate Limit** | 10 requests / 15 min |

**Request:**
```json
{
  "token": "<reset-token-from-email>",
  "newPassword": "newpass123"
}
```

**Expected:**

| Scenario | Status |
|---|---|
| Valid token + new password | `200` |
| Invalid / expired token | `400` |

---

### 4.2 Admin — Employee Management

> All admin routes require a valid JWT with `role: "admin"`.

#### TC-ADMIN-01 — Add Employee

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/admin/employees` |
| **Auth** | Admin token required |

**Request:**
```json
{
  "email": "new@example.com",
  "password": "password123",
  "name": "New Employee",
  "division": "Engineering"
}
```

**Expected:**

| Scenario | Status | Body |
|---|---|---|
| Valid data | `201` | `{ status: "success", data: { id, name, email, division } }` |
| Duplicate email | `400` | Error message |
| Missing required fields | `400` | Validation error |
| Non-admin user | `403` | Forbidden |

---

#### TC-ADMIN-02 — Get All Employees

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/employees` |
| **Auth** | Token required |

**Expected:** `200` with `{ status: "success", data: [ ...users ] }`.

---

#### TC-ADMIN-03 — Edit Employee

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/admin/employees/:id` |
| **Auth** | Admin token required |

**Request:**
```json
{
  "name": "Updated Name",
  "division": "Product"
}
```

**Expected:**

| Scenario | Status |
|---|---|
| Valid ID & data | `200` with updated user |
| Invalid ObjectId | `400` |
| Not found | `404` |

---

#### TC-ADMIN-04 — Delete Employee

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/admin/employees/:id` |
| **Auth** | Admin token required |

**Expected:**

| Scenario | Status |
|---|---|
| Valid ID | `200` `{ status: "success" }` |
| Not found | `404` |

---

#### TC-ADMIN-05 — Toggle Employee Status

| Field | Value |
|---|---|
| **Endpoint** | `PATCH /api/admin/employees/:id/toggle-status` |
| **Auth** | Admin token required |

**Expected:** `200` with updated `isActive` field toggled.

---

#### TC-ADMIN-06 — Analytics

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/analytics` |
| **Auth** | Admin token required |

**Expected:** `200` with division-level worklog analytics data.

---

### 4.3 Work Logs (CRUD)

> All worklog routes require a valid JWT token.

#### TC-WL-01 — Create Work Log

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/worklogs` |
| **Test File** | `worklog.test.js` |

**Request:**
```json
{
  "title": "Daily Standup",
  "content": "Discussed project progress and blockers.",
  "tag": ["meeting", "daily"],
  "media": []
}
```

**Expected:**

| Scenario | Status | Body |
|---|---|---|
| Valid data | `201` | WorkLog object with `_id` |
| Missing title | `400` | Validation error |
| No auth token | `401` | Unauthorized |

---

#### TC-WL-02 — Get All Work Logs (Feed)

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs` |

**Expected:** `200` with array of work logs (most recent first).

---

#### TC-WL-03 — Get Work Log by ID

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/:id` |

**Expected:**

| Scenario | Status |
|---|---|
| Valid ID | `200` with full worklog object |
| Not found | `404` |
| Invalid ObjectId | `400` |

---

#### TC-WL-04 — Edit Work Log

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/worklogs/:id` |

**Request:**
```json
{ "content": "Updated content after the meeting." }
```

**Expected:**

| Scenario | Status |
|---|---|
| Owner edits | `200` with updated object |
| Not owner | `403` |
| Not found | `404` |

---

#### TC-WL-05 — Delete Work Log

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/worklogs/:id` |

**Expected:**

| Scenario | Status | Body |
|---|---|---|
| Owner deletes | `200` | `{ message: "WorkLog deleted successfully" }` |
| Not owner | `403` | Forbidden |
| Not found | `404` | Not found |

---

#### TC-WL-06 — Filter Work Logs

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/filter` |

**Query Params:**
```
?tag=meeting&author=<userId>&startDate=2026-01-01&endDate=2026-04-15
```

**Expected:** `200` with filtered array.

---

#### TC-WL-07 — AI Summarize Work Logs

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/worklogs/summarize` |

**Expected:** `200` with AI-generated summary of visible work logs.

---

#### TC-WL-08 — Get Related Work Logs

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/:id/related` |

**Expected:** `200` with array of semantically similar work logs.

---

#### TC-WL-09 — My Stats

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/my-stats` |

**Expected:** `200` with personal activity statistics (posts per week, most used tags, etc.).

---

### 4.4 Work Log — Versions

#### TC-VER-01 — Add Version

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/worklogs/:id/versions` |
| **Test File** | `version.test.js` |

**Request:**
```json
{ "message": "Updated title and content" }
```

**Expected:** `201` with `{ message: "Version added" }`.

---

#### TC-VER-02 — Get Versions

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/:id/versions` |

**Expected:** `200` with `{ versions: [ ...logHistory ] }` array sorted chronologically.

---

#### TC-VER-03 — Get Log History by ID

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/loghistory/:id` |

**Expected:** `200` with single log history entry.

---

### 4.5 Work Log — Collaborators

#### TC-COL-01 — Add Collaborator

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/worklogs/:id/collaborators` |
| **Test File** | `collaborator.test.js` |

**Request:**
```json
{ "email": "collaborator@example.com" }
```

**Expected:**

| Scenario | Status | Body |
|---|---|---|
| Valid email (existing user) | `200` | `{ message: "Collaborator added", log: { collaborators: [...] } }` |
| User not found | `404` | Error |
| Already a collaborator | `400` | Error |

---

#### TC-COL-02 — Get Collaborators

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/worklogs/:id/collaborators` |

**Expected:** `200` with `{ collaborators: [ ...userObjects ] }`.

---

#### TC-COL-03 — Remove Collaborator

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/worklogs/:id/collaborators/:collaboratorId` |

**Expected:** `200` with `{ message: "Collaborator removed successfully" }`.

---

### 4.6 Chatbot (AI + RAG)

#### TC-CHAT-01 — Send Message

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/chatbot` |
| **Auth** | Bearer token required |

**Request:**
```json
{
  "message": "What did the team work on this week?",
  "session_id": "optional-uuid"
}
```

**Expected:**

| Scenario | Status | Body Fields |
|---|---|---|
| Valid message | `201` | `session_id`, `response`, `context_logs_count`, `sources`, `processing_time` |
| Empty message | `400` | Error |
| No embedding / no logs | `201` | Graceful fallback response |
| Invalid token | `401` | Unauthorized |

---

#### TC-CHAT-02 — Get Chat History (All Sessions)

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/chatbot/history` |

**Query Params:** `?page=1&limit=10`

**Expected:** `200` with `{ chats: [...], pagination: { ... } }`.

---

#### TC-CHAT-03 — Get Session Messages

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/chatbot/session/:session_id` |

**Expected:**

| Scenario | Status |
|---|---|
| Valid session with messages | `200` with `{ messages: [...], count: N }` |
| Empty / not found | `404` |

---

#### TC-CHAT-04 — Delete Session

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/chatbot/session/:session_id` |

**Expected:**

| Scenario | Status |
|---|---|
| Valid session | `200` `{ message: "Chat session deleted successfully", deleted_count: N }` |
| Not found | `404` |

---

### 4.7 Reactions

#### TC-REACT-01 — Get Reactions

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/reactions/:worklogId` |

**Expected:** `200` with reaction counts and current user's reaction.

---

#### TC-REACT-02 — Toggle Reaction

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/reactions/:worklogId` |

**Request:**
```json
{ "type": "like" }
```

**Expected:** `200` with updated reaction state (adds if not present, removes if already reacted with same type).

---

### 4.8 Comments

#### TC-COM-01 — Get Comments

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/comments/:worklogId` |

**Expected:** `200` with array of comments including nested replies.

---

#### TC-COM-02 — Add Comment

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/comments/:worklogId` |

**Request:**
```json
{ "text": "Great work on this!" }
```

**Expected:** `201` with created comment object.

---

#### TC-COM-03 — Reply to Comment

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/comments/:worklogId/reply/:commentId` |

**Request:**
```json
{ "text": "Thanks for the feedback!" }
```

**Expected:** `201` with reply object nested under parent comment.

---

#### TC-COM-04 — Delete Comment

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/comments/:commentId` |

**Expected:**

| Scenario | Status |
|---|---|
| Owner deletes | `200` |
| Not owner | `403` |

---

### 4.9 File Upload

#### TC-UP-01 — Single File Upload

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/upload` |
| **Content-Type** | `multipart/form-data` |

**Body:** Form-data with field `file`.

**Expected:** `200` with `{ url: "..." }`.

---

#### TC-UP-02 — Multiple File Upload

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/upload/multiple` |

**Expected:** `200` with array of URLs.

---

#### TC-UP-03 — Delete File

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/upload` |

**Request:**
```json
{ "url": "https://..." }
```

**Expected:** `200` with `{ success: true }`.

---

## 5. Frontend Manual Test Cases

Base URL: `http://localhost:8080`

### 5.1 Login Page

**Route:** `/login`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-01 | Valid login | Enter registered email + password → click Login | Redirected to `/` (dashboard) |
| F-02 | Wrong password | Enter wrong password → click Login | Error message shown, no redirect |
| F-03 | Empty fields | Click Login without filling form | Validation message shown |
| F-04 | Forgot password link | Click "Forgot Password" | Navigated to `/reset-password` |
| F-05 | Already logged in | Visit `/login` with valid token | Redirected to dashboard |

---

### 5.2 Dashboard / Feed

**Route:** `/`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-06 | Load feed | Navigate to `/` | Work log cards displayed, newest first |
| F-07 | View work log detail | Click on a work log card | Full work log content shown |
| F-08 | React to a post | Click reaction button (👍, ❤️, etc.) | Reaction count updates immediately |
| F-09 | Add comment | Type in comment box → press Submit | Comment appears under the post |
| F-10 | Reply to comment | Click "Reply" on a comment → submit | Nested reply appears |
| F-11 | Navigate to editor | Click "New Work Log" or "+ Create" | Navigated to `/blog-editor` |

---

### 5.3 WorkLog Editor

**Route:** `/blog-editor`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-12 | Create work log | Fill title + content + tags → click Save | Work log created, redirected to feed |
| F-13 | Rich text formatting | Use toolbar (bold, italic, headings, lists) | Text formatting applied in editor |
| F-14 | Image upload | Click image button → select file | Image embedded in editor content |
| F-15 | Add tags | Type a tag and press Enter | Tag chip added |
| F-16 | Add collaborator | Search user email in collaborator field → add | Collaborator shown on the post |
| F-17 | Edit existing log | Open existing log in editor → modify → save | Changes saved and reflected |
| F-18 | Delete work log | Click delete → confirm dialog | Work log removed from feed |
| F-19 | View version history | Click "Version History" button | List of past versions shown |

---

### 5.4 Chatbot Page

**Route:** `/chatbot`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-20 | Send a message | Type a question → click Send | AI response appears within ~10s |
| F-21 | Multi-turn conversation | Send multiple messages in same session | Context maintained across messages |
| F-22 | Load chat history | Open chatbot page with prior sessions | Previous sessions listed in sidebar |
| F-23 | Switch sessions | Click a previous session | Messages from that session loaded |
| F-24 | Delete chat session | Click delete on a session → confirm | Session removed from list |
| F-25 | Empty message | Click Send with empty input | No API call made, input stays focused |

---

### 5.5 Profile Page

**Route:** `/profile`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-26 | View profile | Navigate to `/profile` | Name, email, division, avatar displayed |
| F-27 | Edit name/division | Change fields → click Save | Updated info reflects on page |
| F-28 | Change avatar | Upload profile picture | New avatar displayed |

---

### 5.6 My Stats Page

**Route:** `/my-stats`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-29 | View stats | Navigate to `/my-stats` | Charts/stats for personal worklog activity shown |
| F-30 | Filter by date range | Select date range | Stats update accordingly |

---

### 5.7 Admin Panel

**Route:** `/admin` (Admin role required)

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-31 | Access as admin | Log in as admin → navigate to `/admin` | Admin panel loads |
| F-32 | Access as regular user | Navigate to `/admin` | Redirected or access denied |
| F-33 | Add employee | Fill form → click Add | New employee appears in list |
| F-34 | Edit employee | Click edit on employee → change data | Updated info shown |
| F-35 | Delete employee | Click delete → confirm | Employee removed from list |
| F-36 | Toggle active status | Click toggle on employee | `isActive` status switches |
| F-37 | View analytics | Click on Analytics section | Division-level stats displayed |

---

### 5.8 Password Reset Flow

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-38 | Request reset | Navigate to `/reset-password` → enter email → submit | "Check your email" message shown |
| F-39 | Open reset link | Click link from email → navigated to `/new-password/:token` | New password form shown |
| F-40 | Set new password | Enter and confirm new password → submit | Password updated, redirected to login |
| F-41 | Expired/invalid token | Open expired reset link | Error message shown |

---

## 6. Security & Middleware Tests

### 6.1 Auth Middleware

| # | Test Case | Expected |
|---|---|---|
| S-01 | Request to protected route without token | `401 Unauthorized` |
| S-02 | Request with expired token | `401 Unauthorized` |
| S-03 | Request with tampered/invalid JWT | `401 Unauthorized` |
| S-04 | Non-admin accessing admin route | `403 Forbidden` |

---

### 6.2 Rate Limiting

| Endpoint | Limit | Window | Expected on Exceed |
|---|---|---|---|
| `POST /api/auth/login` | 5 requests | 15 minutes | `429 Too Many Requests` |
| `POST /api/auth/forgot-password` | 5 requests | 1 hour | `429 Too Many Requests` |
| `POST /api/auth/reset-password` | 10 requests | 15 minutes | `429 Too Many Requests` |

---

### 6.3 CORS

| # | Test Case | Expected |
|---|---|---|
| S-05 | Request from `http://localhost:8080` | `200` — allowed |
| S-06 | Request from `http://localhost:3000` | `200` — allowed (any localhost port) |
| S-07 | Request from `https://nebwork.app` | `200` — allowed (production origin) |
| S-08 | Request from arbitrary third-party domain | CORS header absent — browser blocks |

---

### 6.4 Helmet Security Headers

All responses should include headers set by `helmet`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (modern standard)

---

## 7. AI / Chatbot Integration Tests

### 7.1 OpenRouter API Connectivity

**Test:** Verify the AI service can reach OpenRouter and the model responds.

```bash
cd backend
node -e "
require('dotenv').config();
const key = process.env.OPENROUTER_API_KEY || process.env.MODEL_ACCESS_KEY;
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
  body: JSON.stringify({
    model: 'openai/gpt-5.3-chat',
    messages: [{ role: 'user', content: 'Say hi in one word' }],
    max_tokens: 50
  })
}).then(r => r.json()).then(d => console.log('Response:', d.choices?.[0]?.message?.content));
"
```

**Expected:** Response printed to console (e.g. `"Hi"`).

---

### 7.2 AI Response Quality

| # | Query | Expected Behavior |
|---|---|---|
| AI-01 | "What did [name] work on?" | Returns answer citing relevant work logs |
| AI-02 | "Summarize last week's activities" | Summary of recent logs with author citations |
| AI-03 | "What are the most common topics?" | Aggregated topic analysis |
| AI-04 | Question about non-existent topic | Returns "not found in available logs" |
| AI-05 | Greeting ("Hello") | Responds appropriately without making up data |

---

### 7.3 Fallback Behavior

| # | Condition | Expected |
|---|---|---|
| AI-06 | No worklogs in database | Returns friendly message: "I don't have any work logs" |
| AI-07 | Vector search returns 0 results | Falls back to most recent logs, still answers |
| AI-08 | AI API timeout (>30s) | Returns `500` with timeout error message |

---

## 8. Embedding & Vector Search Tests

### 8.1 Embedding Generation

**Test Script:**
```bash
cd backend
node src/scripts/checkEmbeddings.js
```

**Expected output:**
```
✅ Connected to MongoDB
📊 Total WorkLogs: N
✅ WorkLogs WITH embeddings: N
❌ WorkLogs WITHOUT embeddings: 0
🎉 All worklogs have embeddings! Chatbot should work.
```

### 8.2 Vector Search Verification

| # | Condition | Expected |
|---|---|---|
| VS-01 | Index `worklog_vector_index` exists and is READY | No warning in server logs |
| VS-02 | All documents have `embedding` field populated | `Size > 0B` in Atlas Vector Search dashboard |
| VS-03 | Chatbot response includes `context_logs_count > 0` | Semantic search returning results |
| VS-04 | Warning "Vector search returned 0 results" absent | Index is working correctly |

### 8.3 Embedding Dimensions

All embeddings must be exactly **1536 dimensions** (model: `openai/text-embedding-3-small`) to match the Atlas index configuration.

---

## 9. Error Handling & Edge Cases

| # | Scenario | Expected Behavior |
|---|---|---|
| E-01 | MongoDB connection lost | Server logs error, returns `500` if request made |
| E-02 | Invalid MongoDB ObjectId in URL | `400 Bad Request` |
| E-03 | Request body exceeds 50MB limit | `413 Payload Too Large` |
| E-04 | Missing required field in request body | `400` with validation message |
| E-05 | File upload with unsupported type | Rejected by multer |
| E-06 | AI embedding API fails | Chatbot falls back to recent logs search |
| E-07 | AI response is empty | `500` with "Empty AI response" |
| E-08 | User accesses another user's chat session | Returns `404` (not found — user-scoped queries) |
| E-09 | Token present but user deleted from DB | `401 Unauthorized` |
| E-10 | Server health check | `GET /health` returns `200 { status: "healthy" }` |

---

## 10. Test Results & Reports

### 10.1 Automated Test Report

After running `npm test`, results are saved to:

```
backend/reports/test-results.json
```

This includes: test suite names, pass/fail status, duration, and error messages.

### 10.2 Test Suite Summary

| Test File | Test Cases | Coverage Area |
|---|---|---|
| `auth.test.js` | 6 | Admin CRUD + Auth login/logout/forgot-password |
| `worklog.test.js` | 4 | WorkLog Create / Read / Update / Delete |
| `version.test.js` | 2 | Version history add & retrieve |
| `collaborator.test.js` | 3 | Add / Get / Remove collaborators |

**Total automated tests: 15**

### 10.3 Known Limitations

> [!NOTE]
> The following areas are currently tested **manually only** and are candidates for future automated test coverage:
> - Chatbot (`/api/chatbot`) — requires live OpenRouter API
> - Reactions & Comments
> - File Upload (requires storage config)
> - Frontend (no Cypress/Playwright tests yet)

### 10.4 Recommended Next Steps

| Priority | Action |
|---|---|
| High | Add integration tests for chatbot service using mocked OpenRouter API |
| High | Add Cypress or Playwright for frontend E2E testing |
| Medium | Add test coverage report (`--coverage` flag in Jest config) |
| Medium | Add tests for reactions, comments, and upload endpoints |
| Low | Set up CI/CD pipeline (GitHub Actions) to run tests on every PR |

---

*Documentation maintained by the NEBWORK Team (KADA Group 2)*  
*Arrizal · Regina · Salwanetta · Gideon · Jovan*
