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
  
**Frontend:** React.js, Recharts, Vite ⚡  
**Backend:** Spring Boot, REST APIs  
**Database:** MySQL (User Auth & Roles)  
**Integration:** Google Sheets API  
**Other Tools:** Node.js, Axios, JWT Authentication  

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
