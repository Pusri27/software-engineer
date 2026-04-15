# NEBWORK - Use Case Diagram (Simple Version)

> **Platform:** Work Logging & Knowledge Management  
> **Team:** KADA Group 2  
> **Date:** February 4, 2026

---

## 📊 Use Case Diagram

![NEBWORK Simple Use Case Diagram](/Users/pusri/.gemini/antigravity/brain/bbb7cca6-e5f5-449c-8469-18c514df102e/simple_use_case_diagram_1770176112809.png)

---

## 🔄 User Flow Diagram

![User Flow Diagram](/Users/pusri/.gemini/antigravity/brain/bbb7cca6-e5f5-449c-8469-18c514df102e/user_flow_diagram_1770176193678.png)

---

## 🏗️ System Architecture

![System Architecture](/Users/pusri/.gemini/antigravity/brain/bbb7cca6-e5f5-449c-8469-18c514df102e/system_architecture_1770176227592.png)

---

## 👥 Actors

### 1. User (Karyawan)
Karyawan yang menggunakan sistem untuk mencatat pekerjaan dan berkolaborasi.

**Hak Akses:**
- ✅ Authentication & Profile
- ✅ Work Log Management
- ✅ Collaboration
- ✅ AI Chatbot

### 2. Admin
Administrator yang mengelola karyawan dan memiliki semua akses User.

**Hak Akses:**
- ✅ Semua akses User
- ✅ Manage Employees

---

## 📋 Use Cases

### 🔐 AUTHENTICATION

#### 1. Login
**Deskripsi:** User login menggunakan email dan password  
**Actor:** User, Admin  
**Input:** Email, Password  
**Output:** JWT Token, User Data

#### 2. Manage Profile
**Deskripsi:** User melihat dan mengupdate profil pribadi  
**Actor:** User, Admin  
**Fitur:** View profile, Update name/division/photo

#### 3. Reset Password
**Deskripsi:** User reset password jika lupa  
**Actor:** User, Admin  
**Flow:** Request reset → Email token → Set new password

---

### 📝 WORK LOG

#### 4. Create Work Log
**Deskripsi:** User membuat catatan pekerjaan baru  
**Actor:** User, Admin  
**Input:** Title, Content, Tags, Media (optional)  
**Output:** Work log tersimpan + AI embeddings

#### 5. View Work Logs
**Deskripsi:** User melihat daftar work logs  
**Actor:** User, Admin  
**Fitur:** Filter by tag, Filter by date, Search

#### 6. Edit Work Log
**Deskripsi:** User mengupdate work log  
**Actor:** User, Admin  
**Akses:** Owner atau Collaborator

#### 7. Delete Work Log
**Deskripsi:** User menghapus work log  
**Actor:** User, Admin  
**Akses:** Owner only

---

### 🤝 COLLABORATION

#### 8. Add Collaborator
**Deskripsi:** User menambahkan collaborator ke work log  
**Actor:** User, Admin  
**Akses:** Owner only  
**Benefit:** Collaborator dapat edit work log

#### 9. Manage Versions
**Deskripsi:** User mengelola version history work log  
**Actor:** User, Admin  
**Fitur:** 
- Add new version
- View version history
- Compare versions

---

### 🤖 AI CHATBOT

#### 10. Chat with AI
**Deskripsi:** User bertanya ke AI tentang work logs  
**Actor:** User, Admin  
**Teknologi:** 
- Text Embedding 3 Large (semantic search)
- DeepSeek-R1-Distill-Llama-70B (response generation)

**Contoh Pertanyaan:**
- "Apa deliverables project Q4?"
- "Siapa yang handle feature authentication?"
- "Bagaimana cara setup database?"

#### 11. View History
**Deskripsi:** User melihat riwayat chat dengan AI  
**Actor:** User, Admin  
**Fitur:** View sessions, View messages, Delete session

---

### 👥 ADMIN

#### 12. Manage Employees
**Deskripsi:** Admin mengelola data karyawan  
**Actor:** Admin only  
**Fitur:**
- View all employees
- Add new employee
- Edit employee data
- Delete employee

---

## 🔄 User Flow Examples

### Flow 1: Membuat Work Log
```
Login → Dashboard → Create Work Log → Input data → Upload media → Save
→ AI generates embeddings (background)
```

### Flow 2: Kolaborasi Tim
```
Login → View Work Logs → Select work log → Add Collaborator → Select employee
→ Collaborator can now edit → Collaborator adds version → Owner reviews changes
```

### Flow 3: Mencari Informasi via AI
```
Login → Open Chatbot → Ask question → AI searches work logs → AI generates answer
→ User gets relevant information
```

### Flow 4: Admin Menambah Karyawan
```
Admin Login → Employee Management → Add Employee → Input data → Save
→ Employee receives welcome email → Employee sets password → Employee can login
```

---

## 🎯 Key Features

### 1. **Work Log Management**
- Create, Read, Update, Delete work logs
- Rich text editor dengan media upload
- Tag-based organization
- Filter dan search

### 2. **Version Control**
- Track changes over time
- Add new versions
- Compare versions
- Restore previous versions

### 3. **Collaboration**
- Add multiple collaborators
- Real-time collaboration
- Track who edited what

### 4. **AI-Powered Search**
- Semantic search menggunakan embeddings
- Natural language queries
- Context-aware responses
- Chat history

### 5. **Admin Dashboard**
- Employee management
- View all work logs
- System monitoring

---

## 🔒 Security & Access Control

| Feature | User | Admin |
|---------|------|-------|
| Login/Logout | ✅ | ✅ |
| Manage own profile | ✅ | ✅ |
| Create work log | ✅ | ✅ |
| Edit own work log | ✅ | ✅ |
| Edit collaborated work log | ✅ | ✅ |
| Delete own work log | ✅ | ✅ |
| View own work logs | ✅ | ✅ |
| View all work logs | ❌ | ✅ |
| Add collaborator (owner) | ✅ | ✅ |
| Use AI chatbot | ✅ | ✅ |
| Manage employees | ❌ | ✅ |

---

## 📱 Technology Stack

### Backend
- **Framework:** Node.js + Express.js
- **Database:** MongoDB
- **Auth:** JWT
- **Storage:** DigitalOcean Spaces / AWS S3

### AI Services
- **Chatbot:** DeepSeek-R1-Distill-Llama-70B
- **Embeddings:** Text Embedding 3 Large

### Frontend
- **Framework:** React + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Editor:** Tiptap (collaborative rich text)

---

## 📊 Statistics

- **Total Use Cases:** 12 (simplified from 26)
- **Total Actors:** 2 (User, Admin)
- **Categories:** 5 (Auth, Work Log, Collaboration, AI, Admin)
- **API Endpoints:** 20+

---

## 🚀 Getting Started

### For Users:
1. Login dengan kredensial dari admin
2. Update profil dan foto
3. Mulai create work log
4. Tambahkan collaborator jika perlu
5. Gunakan AI chatbot untuk mencari informasi

### For Admins:
1. Login sebagai admin
2. Tambahkan karyawan baru
3. Monitor work logs
4. Kelola data karyawan

---

## 📞 Support

- **Documentation:** [BACKEND_DOCUMENTATION.md](./backend/BACKEND_DOCUMENTATION.md)
- **API Docs:** http://localhost:5000/api-docs
- **Website:** https://nebwork.app

---

**Version:** 1.0.0 (Simplified)  
**Last Updated:** February 4, 2026
