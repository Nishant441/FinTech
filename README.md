# ⚡ FinSight Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**FinSight Engine** is a high-performance financial analytics dashboard designed to transform raw transaction data into actionable insights. Built with a modern, decoupled architecture, it leverages **FastAPI** for a robust backend and **React + Vite** for a cinematic, responsive user experience.

---
## Demo
![FinSight](https://github.com/user-attachments/assets/2954ed41-eb29-4ba1-ab28-d03be01aeade)

---
## 🚀 Key Features

- **📊 Intelligent Analytics**: Real-time spending breakdown by category and month-over-month growth metrics.
- **🔄 Recurring Transaction Detection**: Advanced heuristic algorithms to identify and tag monthly subscriptions and recurring patterns.
- **📈 AI-Powered Forecasting**: Predictive spending models powered by NumPy and Pandas to forecast next-month expenditures.
- **📄 Automated PDF Reporting**: Generate high-fidelity, professional financial reports instantly using **ReportLab**.
- **📁 CSV Ingestion**: Seamlessly upload and process bank transaction data with built-in schema validation and deduplication.
- **☁️ Production Ready**: Optimized for modern cloud platforms (Vercel, Render, Neon) with full PostgreSQL support.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (High-performance Python API)
- **Database**: PostgreSQL (Production) / SQLite (Local)
- **ORM**: SQLAlchemy
- **Data Science**: Pandas, NumPy
- **Migrations**: Alembic
- **Reports**: ReportLab

### **Frontend**
- **Library**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS / CSS Modules
- **Charts**: Recharts (Customized cinematic charts)
- **Icons**: Lucide React

---

## ⚙️ Installation & Setup

### 1. Backend Setup
1. **Prepare Environment**:
   ```bash
   cd backend && python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```
2. **Run Server**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. **Install Dependencies**:
   ```bash
   cd frontend && npm install
   ```
2. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/dashboard-data` | `GET` | Retrieves metrics, category breaks, and trends. |
| `/analytics/recurring` | `GET` | Analyzes history for monthly subscription patterns. |
| `/upload` | `POST` | Processes CSV transaction files. |
| `/export-pdf` | `GET` | Generates a downloadable financial report. |

---

## 📊 Database Schema
The engine uses a relational schema with a focus on auditability:
- **`uploaded_files`**: Tracks metadata for every CSV ingested.
- **`transactions`**: Stores atomic spending records mapped to files.
- **`is_recurring`**: Dynamic tagging for subscription detection.

---

## 🌐 Deployment
This project is configured for **Decoupled Deployment**:
- **Frontend**: Hosted on [Vercel](https://vercel.com) (Edge-optimized).
- **Backend**: Hosted on [Render](https://render.com) (Containerized).
- **Database**: Managed by [Neon.tech](https://neon.tech) (Serverless PostgreSQL).

---

*Built with passion by [Nishant441](https://github.com/Nishant441)*
