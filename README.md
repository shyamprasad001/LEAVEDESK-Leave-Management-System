# 🎓 LeaveDESK — Faculty Leave Management System

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

**Live Demo:** [Insert Your Render URL Here]

A secure, full-stack web application engineered to digitize and automate faculty leave requests. Built with a robust Node.js/Express backend, role-based access control, and a fully automated zero-touch CI/CD deployment pipeline.

---

## ✨ Key Features

**🔐 Security & Authentication**
- **Role-Based Access Control (RBAC):** Distinct routing and dashboards for Faculty and HODs.
- **Cryptographic Security:** Passwords hashed securely, preventing plain-text data breaches.
- **OTP Verification:** Automated 6-digit OTP email verification for new account registrations using `nodemailer` and `crypto`.

**👨‍🏫 Faculty Portal**
- Apply for 7 distinct types of leave (Casual, Medical, Earned, etc.).
- Mark applications as Urgent for priority review.
- View, filter, and cancel pending applications.
- Receive automated email notifications upon HOD approval or rejection.

**👑 HOD Portal**
- Department-scoped dashboard providing an overview of all staff leaves.
- Approve or Reject requests with mandatory feedback comments.
- Filter requests by status & type.
- Monitor faculty member leave statistics and pending request counts.

**⚙️ DevOps & Quality Assurance**
- **100% Test Coverage:** Comprehensive unit testing suite written in **Jest** and **Supertest**.
- **Code Quality:** Enforced Quality Gates via **SonarQube** static analysis.
- **Containerization:** Immutable, secure Docker builds running with optimized user privileges.
- **CI/CD Pipeline:** Fully automated **Jenkins** pipeline handling testing, building, tagging, and deployment to **Render**.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose
* **Frontend:** HTML/CSS/JS, Pug Templating Engine
* **Testing:** Jest, Supertest
* **DevOps:** Docker, Jenkins, SonarQube, Render

---

## 📂 Project Structure

```text
faculty-leave-system/
├── Jenkinsfile                  ← CI/CD automated pipeline configuration
├── sonar-project.properties     ← SonarQube quality gate rules
├── backend/                     
│   ├── app.js                   ← Main server entry point
│   ├── Dockerfile               ← Secure container configuration
│   ├── .dockerignore            ← Excluded sensitive files
│   ├── package.json
│   ├── .env.example
│   ├── __tests__/               ← 100% Coverage unit test suite
│   ├── models/                  ← Mongoose schemas (User, LeaveRequest)
│   ├── routes/                  ← RBAC Express routes (auth, faculty, hod)
│   └── utils/                   
│       └── mailer.js            ← Nodemailer OTP and status email triggers
│
└── frontend/                    ← Client-side assets and views
    ├── public/
    │   ├── css/style.css        
    │   └── js/main.js           
    └── views/                   ← Authentication, Faculty, and HOD templates

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
