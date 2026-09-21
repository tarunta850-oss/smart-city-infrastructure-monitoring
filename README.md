# 🏙️ Smart Civic Road Issue Reporting & Triage System

An AI-powered, full-stack municipal civic issue reporting, severity triaging, and officer management platform.

---

## 🌟 Key Features

- **Officer Command Center (Screenshot 1 Fidelity)**:
  - Dynamic summary counters: Pending, In Progress, Resolved, Disputed.
  - Priority & Status multi-level filtering with keyword/location search.
  - Interactive table with thumbnail inspection, citizen email outreach, map locator, and workflow progression (`Start`, `Resolve`).
- **AI Severity Engine (Computer Vision + NLP)**:
  - OpenCV-based cavity detection, asphalt crack/fracture texture analysis, waterlogging reflections, and depth contrast gradient.
  - Natural Language Processing urgency extraction + AHP weighted scoring formula.
- **Theme Switching**: Seamless Dark Mode / Light Mode with persistent storage.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: User & Officer provisioning, team assignment, department management.
  - **Officer**: Issue triage, progress tracking, status resolution, citizen contact.
  - **Citizen**: Photo uploads, GPS geolocation, upvoting, report tracking.
- **Cross-Platform Ready**: 1-click startup scripts for Windows, macOS, Linux, and Docker.

---

## 🚀 Quick Start (1-Click Run)

### 🪟 Windows
Double-click `start_windows.bat` or run:
```cmd
start_windows.bat
```

### 🍎 macOS / 🐧 Linux
Make executable and run `start_unix.sh`:
```bash
chmod +x start_unix.sh seed_database.sh
./start_unix.sh
```

### 🐳 Docker Compose
```bash
docker compose up --build
```

---

## 🛠️ Manual Development Setup

### 1. Backend (FastAPI + Python)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed_all_accounts.py
python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```
- **Backend API**: `http://localhost:8005`
- **Swagger Interactive Docs**: `http://localhost:8005/docs`

### 2. Frontend (React + Vite + TailwindCSS)
```bash
cd frontend/cityreport
npm install
npm run dev
```
- **Frontend App**: `http://localhost:3005`

---

## 🔑 Default User Accounts & Credentials

| Role | Email | Password | Access / Function |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@example.com` | `admin123` | System configuration, user & officer management |
| **Field Officer** | `taruna.24.becs@acharya.ac.in` | `password123` | Road inspection, severity triage, report resolution |
| **Citizen (Public)** | `tarunta850@gmail.com` | `password123` | Road issue reporting, photo upload, issue tracking |

---

## 📂 Project Directory Structure

```
civic-final/
├── backend/
│   ├── ai_analysis.py          # OpenCV Computer Vision & NLP Severity Engine
│   ├── database.py             # Async SQLAlchemy Engine & Session
│   ├── main.py                 # FastAPI Application & Reverse Proxy Mounts
│   ├── models.py               # Database Models (Users, Reports, Teams, etc.)
│   ├── schemas.py              # Pydantic Request/Response Validation Schemas
│   ├── seed_all_accounts.py    # Database Seeding Utility
│   ├── requirements.txt        # Backend Dependencies
│   └── routers/
│       ├── auth.py             # JWT Authentication & RBAC
│       ├── reports.py          # Report Submission, AI Scoring & Queries
│       ├── admin.py            # Admin Officer Management & Stats
│       └── ...
├── frontend/
│   └── cityreport/
│       ├── src/
│       │   ├── components/     # UI Components (Navbar, AI Cards, Modals)
│       │   ├── pages/
│       │   │   ├── auth/       # Welcome, Login, Signup Pages
│       │   │   ├── officer/    # Redesigned Officer Dashboard
│       │   │   ├── citizen/    # Citizen Report & Tracking Portal
│       │   │   └── admin/      # Admin Management & Analytics
│       │   ├── utils/          # Image helpers & API client
│       │   ├── index.css       # Global styles & Dark/Light theme variables
│       │   └── App.jsx         # App Routing & Theme State
│       └── package.json
├── docker-compose.yml          # Multi-container Docker Orchestration
├── render.yaml                 # Cloud Deployment Blueprint
├── start_windows.bat           # Windows 1-Click Startup Launcher
├── start_unix.sh               # Unix/macOS 1-Click Startup Launcher
├── seed_database.bat           # Windows Database Seeder Script
└── seed_database.sh            # Unix/macOS Database Seeder Script
```

---

## ☁️ Cloud Deployment

### Render / VPS / Container Deployments
- Blueprint: `render.yaml` is pre-configured for web services and managed PostgreSQL with PostGIS.
- Reverse Proxy: Built-in reverse proxy routes frontend and backend cleanly without CORS friction.
