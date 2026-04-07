# NEBWORK - Use Case Summary

> Quick reference guide untuk semua use cases dalam NEBWORK platform

---

## 🔐 Authentication & Profile (6 Use Cases)

| ID | Use Case | Actor | Endpoint | Method |
|---|---|---|---|---|
| UC-01 | Login | User, Admin | `/api/auth/login` | POST |
| UC-02 | Logout | User, Admin | `/api/auth/logout` | POST |
| UC-03 | View Profile | User, Admin | `/api/auth/profile` | GET |
| UC-04 | Update Profile | User, Admin | `/api/auth/profile` | PUT |
| UC-05 | Forgot Password | User, Admin | `/api/auth/forgot-password` | POST |
| UC-06 | Reset Password | User, Admin | `/api/auth/reset-password` | POST |

---

## 📝 Work Log Management (7 Use Cases)

| ID | Use Case | Actor | Endpoint | Method |
|---|---|---|---|---|
| UC-07 | Create Work Log | User, Admin | `/api/worklogs` | POST |
| UC-08 | View Work Logs | User, Admin | `/api/worklogs/filter` | GET |
| UC-09 | Update Work Log | User, Admin | `/api/worklogs/:id` | PUT |
| UC-10 | Delete Work Log | User, Admin | `/api/worklogs/:id` | DELETE |
| UC-11 | Filter Work Logs | User, Admin | `/api/worklogs/filter?tag=...` | GET |
| UC-12 | Add Version | User, Admin | `/api/worklogs/:id/versions` | POST |
| UC-13 | View Version History | User, Admin | `/api/worklogs/:id/versions` | GET |

---

## 🤝 Collaboration (3 Use Cases)

| ID | Use Case | Actor | Endpoint | Method |
|---|---|---|---|---|
| UC-14 | Add Collaborator | User, Admin | `/api/worklogs/:id/collaborators` | POST |
| UC-15 | View Collaborators | User, Admin | `/api/worklogs/:id/collaborators` | GET |
| UC-16 | Remove Collaborator | User, Admin | `/api/worklogs/:id/collaborators/:collaboratorId` | DELETE |

---

## 🤖 AI Chatbot (4 Use Cases)

| ID | Use Case | Actor | Endpoint | Method |
|---|---|---|---|---|
| UC-17 | Send Message to Chatbot | User, Admin | `/api/chatbot` | POST |
| UC-18 | View Chat History | User, Admin | `/api/chatbot/history` | GET |
| UC-19 | View Chat Session | User, Admin | `/api/chatbot/session/:session_id` | GET |
| UC-20 | Delete Chat Session | User, Admin | `/api/chatbot/session/:session_id` | DELETE |

---

## 📁 Media Management (2 Use Cases)

| ID | Use Case | Actor | Endpoint | Method |
|---|---|---|---|---|
| UC-21 | Upload Media | User, Admin | `/api/upload` | POST |
| UC-22 | View Media | User, Admin | N/A (URL-based) | GET |

---

## 👥 Admin - Employee Management (4 Use Cases)

| ID | Use Case | Actor | Endpoint | Method |
|---|---|---|---|---|
| UC-23 | View All Employees | Admin | `/api/admin/employees` | GET |
| UC-24 | Add Employee | Admin | `/api/admin/employees` | POST |
| UC-25 | Edit Employee | Admin | `/api/admin/employees/:id` | PUT |
| UC-26 | Delete Employee | Admin | `/api/admin/employees/:id` | DELETE |

---

## 📊 Use Case Statistics

**Total Use Cases:** 26

**By Category:**
- Authentication & Profile: 6 (23%)
- Work Log Management: 7 (27%)
- Collaboration: 3 (12%)
- AI Chatbot: 4 (15%)
- Media Management: 2 (8%)
- Admin - Employee Management: 4 (15%)

**By Actor:**
- User & Admin: 22 (85%)
- Admin Only: 4 (15%)

**By Priority:**
- High: 10 (38%)
- Medium: 12 (46%)
- Low: 4 (16%)

---

## 🔑 Key Features per Actor

### User/Employee Can:
✅ Manage authentication (login, logout, password reset)  
✅ Manage personal profile  
✅ Create, read, update, delete work logs  
✅ Filter and search work logs  
✅ Add versions to work logs (version control)  
✅ Collaborate with other employees  
✅ Upload and view media files  
✅ Chat with AI chatbot for knowledge retrieval  
✅ View chat history  

### Admin Can (in addition to User features):
✅ View all employees  
✅ Add new employees  
✅ Edit employee data  
✅ Delete employees  
✅ View all work logs in the system  

---

## 🎯 User Journey Examples

### Journey 1: New Employee Onboarding
1. **UC-01:** Admin adds new employee
2. **UC-05:** Employee receives welcome email with password reset link
3. **UC-06:** Employee sets new password
4. **UC-01:** Employee logs in
5. **UC-04:** Employee updates profile with photo and division

### Journey 2: Creating Work Log with Collaboration
1. **UC-01:** User logs in
2. **UC-07:** User creates new work log
3. **UC-21:** User uploads supporting documents
4. **UC-14:** User adds collaborators to work log
5. **UC-09:** Collaborator updates work log
6. **UC-12:** User adds new version after major changes

### Journey 3: Knowledge Retrieval via AI
1. **UC-01:** User logs in
2. **UC-17:** User asks chatbot "What are the Q4 project deliverables?"
3. AI searches relevant work logs using embeddings
4. AI generates response based on work log context
5. **UC-18:** User views chat history for reference

### Journey 4: Work Log Version Control
1. **UC-08:** User views work logs
2. **UC-11:** User filters by tag "project-alpha"
3. User selects specific work log
4. **UC-13:** User views version history
5. **UC-12:** User adds new version with updates
6. User compares versions to track changes

---

## 🔒 Access Control Matrix

| Use Case | User | Admin | Authentication Required |
|---|---|---|---|
| UC-01: Login | ✅ | ✅ | ❌ |
| UC-02: Logout | ✅ | ✅ | ✅ |
| UC-03: View Profile | ✅ | ✅ | ✅ |
| UC-04: Update Profile | ✅ | ✅ | ✅ |
| UC-05: Forgot Password | ✅ | ✅ | ❌ |
| UC-06: Reset Password | ✅ | ✅ | ❌ (token-based) |
| UC-07: Create Work Log | ✅ | ✅ | ✅ |
| UC-08: View Work Logs | ✅ | ✅ | ✅ |
| UC-09: Update Work Log | ✅ (owner/collab) | ✅ | ✅ |
| UC-10: Delete Work Log | ✅ (owner only) | ✅ | ✅ |
| UC-11: Filter Work Logs | ✅ | ✅ | ✅ |
| UC-12: Add Version | ✅ (owner/collab) | ✅ | ✅ |
| UC-13: View Version History | ✅ | ✅ | ✅ |
| UC-14: Add Collaborator | ✅ (owner only) | ✅ | ✅ |
| UC-15: View Collaborators | ✅ | ✅ | ✅ |
| UC-16: Remove Collaborator | ✅ (owner only) | ✅ | ✅ |
| UC-17: Send Message to Chatbot | ✅ | ✅ | ✅ |
| UC-18: View Chat History | ✅ | ✅ | ✅ |
| UC-19: View Chat Session | ✅ | ✅ | ✅ |
| UC-20: Delete Chat Session | ✅ | ✅ | ✅ |
| UC-21: Upload Media | ✅ | ✅ | ✅ |
| UC-22: View Media | ✅ | ✅ | ✅ |
| UC-23: View All Employees | ❌ | ✅ | ✅ |
| UC-24: Add Employee | ❌ | ✅ | ✅ |
| UC-25: Edit Employee | ❌ | ✅ | ✅ |
| UC-26: Delete Employee | ❌ | ✅ | ✅ |

---

## 🔄 Use Case Dependencies

### Include Relationships
- **UC-07 (Create Work Log)** includes **UC-21 (Upload Media)** - optional
- **UC-09 (Update Work Log)** includes **UC-21 (Upload Media)** - optional
- **UC-12 (Add Version)** includes **UC-21 (Upload Media)** - optional

### Extend Relationships
- **UC-11 (Filter Work Logs)** extends **UC-08 (View Work Logs)**

### Prerequisites
- Most use cases require **UC-01 (Login)** first
- **UC-06 (Reset Password)** requires **UC-05 (Forgot Password)** first
- **UC-14, UC-15, UC-16 (Collaboration)** require **UC-07 (Create Work Log)** first
- **UC-12, UC-13 (Versioning)** require **UC-07 (Create Work Log)** first

---

## ⚡ Rate Limits & Constraints

| Use Case | Rate Limit | Constraint |
|---|---|---|
| UC-01: Login | 5 attempts / 15 min per IP | - |
| UC-05: Forgot Password | 5 attempts / 1 hour per email | - |
| UC-06: Reset Password | 10 attempts / 15 min per token | Token valid 1 hour |
| UC-21: Upload Media | - | Max 10MB per file |
| UC-17: Send Message to Chatbot | - | Depends on AI API limits |

---

## 📱 Frontend Pages Mapping

| Page | Related Use Cases |
|---|---|
| **Login Page** | UC-01, UC-05 |
| **Reset Password Page** | UC-06 |
| **Dashboard** | UC-08, UC-11 |
| **Profile Page** | UC-03, UC-04 |
| **Work Log Editor** | UC-07, UC-09, UC-21 |
| **Work Log Detail** | UC-08, UC-13, UC-14, UC-15, UC-16 |
| **Chatbot Page** | UC-17, UC-18, UC-19, UC-20 |
| **Admin - Employee Management** | UC-23, UC-24, UC-25, UC-26 |

---

## 🎨 UI Components per Use Case

### Authentication Components
- Login Form (UC-01)
- Logout Button (UC-02)
- Profile Card (UC-03)
- Profile Edit Form (UC-04)
- Forgot Password Form (UC-05)
- Reset Password Form (UC-06)

### Work Log Components
- Work Log Editor (UC-07, UC-09)
- Work Log List (UC-08)
- Work Log Card (UC-08)
- Filter Panel (UC-11)
- Version History Modal (UC-13)
- Version Comparison View (UC-13)

### Collaboration Components
- Collaborator Selector (UC-14)
- Collaborator List (UC-15)
- Collaborator Badge (UC-15)

### Chatbot Components
- Chat Interface (UC-17)
- Chat History Sidebar (UC-18)
- Chat Session View (UC-19)
- Message Bubble (UC-17, UC-19)

### Media Components
- Media Upload Button (UC-21)
- Media Preview (UC-22)
- Document Viewer (UC-22)
- Image Gallery (UC-22)

### Admin Components
- Employee Table (UC-23)
- Add Employee Form (UC-24)
- Edit Employee Modal (UC-25)
- Delete Confirmation Dialog (UC-26)

---

## 🧪 Testing Checklist

### Authentication Testing
- [ ] UC-01: Test valid login
- [ ] UC-01: Test invalid credentials
- [ ] UC-01: Test rate limiting (6th attempt)
- [ ] UC-02: Test logout clears token
- [ ] UC-05: Test forgot password email sent
- [ ] UC-06: Test reset with valid token
- [ ] UC-06: Test reset with expired token
- [ ] UC-06: Test password validation

### Work Log Testing
- [ ] UC-07: Test create work log
- [ ] UC-07: Test create with media upload
- [ ] UC-08: Test view own work logs
- [ ] UC-08: Test view collaborated work logs
- [ ] UC-09: Test update as owner
- [ ] UC-09: Test update as collaborator
- [ ] UC-09: Test update as non-owner/non-collaborator (should fail)
- [ ] UC-10: Test delete as owner
- [ ] UC-10: Test delete as non-owner (should fail)
- [ ] UC-11: Test filter by tag
- [ ] UC-11: Test filter by date range
- [ ] UC-12: Test add version
- [ ] UC-13: Test view version history

### Collaboration Testing
- [ ] UC-14: Test add collaborator as owner
- [ ] UC-14: Test add collaborator as non-owner (should fail)
- [ ] UC-14: Test add duplicate collaborator (should fail)
- [ ] UC-15: Test view collaborators
- [ ] UC-16: Test remove collaborator as owner
- [ ] UC-16: Test remove collaborator as non-owner (should fail)

### Chatbot Testing
- [ ] UC-17: Test send message
- [ ] UC-17: Test AI response generation
- [ ] UC-17: Test semantic search accuracy
- [ ] UC-18: Test view chat history
- [ ] UC-19: Test view specific session
- [ ] UC-20: Test delete session

### Admin Testing
- [ ] UC-23: Test view all employees as admin
- [ ] UC-23: Test view all employees as user (should fail)
- [ ] UC-24: Test add employee with valid data
- [ ] UC-24: Test add employee with duplicate email (should fail)
- [ ] UC-24: Test add employee with weak password (should fail)
- [ ] UC-25: Test edit employee
- [ ] UC-26: Test delete employee

---

## 📚 Related Documentation

- **Full Use Case Documentation:** [USE_CASE_DOCUMENTATION.md](./USE_CASE_DOCUMENTATION.md)
- **Backend API Documentation:** [backend/BACKEND_DOCUMENTATION.md](./backend/BACKEND_DOCUMENTATION.md)
- **Frontend README:** [front-end/README.md](./front-end/README.md)
- **Backend README:** [backend/README.md](./backend/README.md)

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0  
**Team:** KADA Group 2
