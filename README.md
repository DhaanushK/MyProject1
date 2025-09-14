<h1 align="center">📊Automated Accountability System for Daily Metrics Submission with Realtime PM Alerts🚀</h1>
<h3 align="center">Smart Team Metrics Management with Automated Alert System | Google Sheets + React + Spring Boot</h3>
<h4 align="center">Vel Tech High Tech Dr.Rangarajan Dr.Sakunthala Engineering College College</h4>

---

### 🌟 Project Overview
The **Daily Metrics Tracking and Alert System** is a full stack web application designed for **IT support teams** to streamline performance monitoring.
It provides a centralized platform where team members can update their daily metrics, ensuring accuracy and transparency in reporting.

✅ **Team Members** → Update their metrics in assigned Google Sheets  
✅ **Project Managers** → View consolidated reports and dashboards  
✅ **Visual Analytics** → Performance metrics shown via charts & graphs in real-time  

---

### 🛠️ Tech Stack
<div align="center">
  
**Frontend:** 
    React 19 - UI Library
    Vite 7 - Dev Server / Bundler
    React Router DOM 7 - Client Side Routing
    Axios - HTTP Client for API Calls
    Recharts 3 - Data Visualization 
    JSX + ES Modules - Modern Frontend Syntax
    
**Backend:** 
    Node.js - Runtime Environment
    Express 5 - Web Framework / HTTP Server
    CORS - Cross-origin Resource Handling
    JSON Web Tokens - Stateless Authentication
    bcryptjs - Password Hashing
    Mongoose - ODM for MongoDB
    Nodemailer - email sending capability
    Dotenv - Environment Variable Management
    Modular Architecture - Routes, Models, Services, Utils
    
**Database:** 
    MongoDB - Primary Database
    
**Integration:** 
    Google Sheets API - for Reading and Appending Spreadsheet data
    ExcelUS(excel.js) - for Generating / Reading excel files locally
    Nodemailer 
    
</div>

---

### ⚙️ Features
- 🔐 **Role-Based Login** – Team Member / Project Manager  
- 📑 **Google Sheets Integration** – Each member gets their own sheet  
- 📊 **Performance Dashboard** – Charts for Completion Rate, SLA Breaches, Trends  
- ⏰ **Deadline Reminders** – Alerts for late submissions  
- 📥 **Excel/Sheets Export** – Download reports anytime  
- 🔄 **Dynamic Updates** – Dashboards auto-refresh with sheet data  

---

### 📂 Project Structure
```bash
finalyear-project/
│── backend/               # Spring Boot APIs
│   ├── controllers/       # Auth & Metrics Controllers
│   ├── services/          # Business Logic
│   ├── entities/          # JPA Entities
│   └── config/            # Security Config
│
│── frontend/              # React + Vite Frontend
│   ├── src/components/    # UI Components
│   ├── src/pages/         # Dashboards & Views
│   └── src/utils/         # API Helpers
│
└── docs/                  # Documentation
