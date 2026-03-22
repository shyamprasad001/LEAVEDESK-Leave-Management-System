# 🎓 LeaveDESK — Faculty Leave Management System

A full-stack web application for managing faculty leave requests.

```
faculty-leave-system/
├── backend/                  ← Express.js server
│   ├── app.js                   Main server entry point
│   ├── seed.js                  Demo data seeder
│   ├── package.json
│   ├── .env.example
│   ├── models/
│   │   ├── User.js              User schema (faculty & HOD)
│   │   └── LeaveRequest.js      Leave request schema
│   └── routes/
│       ├── auth.js              Login, Register, Logout
│       ├── faculty.js           Faculty routes
│       └── hod.js               HOD routes
│
└── frontend/                 ← Pug templates & static assets
    ├── public/
    │   ├── css/style.css        Full design system
    │   └── js/main.js           Client-side interactions
    └── views/
        ├── layout.pug           Base layout
        ├── 404.pug
        ├── auth/
        │   ├── login.pug
        │   └── register.pug
        ├── faculty/
        │   ├── dashboard.pug
        │   ├── apply.pug
        │   ├── my-leaves.pug
        │   ├── leave-detail.pug
        │   └── profile.pug
        ├── hod/
        │   ├── dashboard.pug
        │   ├── leave-requests.pug
        │   ├── leave-detail.pug
        │   ├── faculty-list.pug
        │   └── profile.pug
        └── partials/
            ├── sidebar-faculty.pug
            ├── sidebar-hod.pug
            └── topbar.pug
```

---

## 🚀 Setup & Run

### Step 1 — Install dependencies
```bash
cd backend
npm install
```

### Step 2 — Configure environment
```bash
cp .env .env
```
Edit `.env` and add your MongoDB Atlas URI:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/faculty_leave_db
SESSION_SECRET=your_secret_key
PORT=3000
```

### Step 3 — Seed demo users
```bash
node seed.js
```

### Step 4 — Start the server
```bash
npm start        # production
npm run dev      # development with auto-reload
```

Visit **http://localhost:3000**

---

## 🔐 Demo Credentials

| Role    | Email               | Password |
|---------|---------------------|----------|
| Faculty | faculty@demo.com    | demo123  |
| HOD     | hod@demo.com        | demo123  |

---

## ✨ Features

**Faculty Portal**
- Apply for 7 types of leave
- Mark application as Urgent
- View & filter all applications
- Cancel pending applications
- View HOD review comments

**HOD Portal**
- Department-scoped leave dashboard
- Approve / Reject with comments
- Filter requests by status & type
- View faculty member list with leave stats
