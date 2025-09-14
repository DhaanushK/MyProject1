<h1 align="center">📊 Final Year Project - Metrics & Performance Dashboard 🚀</h1>
<h3 align="center">Smart Team Metrics Management | Google Sheets + React + Spring Boot</h3>
<h4 align="center">Vel Tech High Tech College</h4>

---

### 🌟 Project Overview
This project is built to **simplify team performance tracking** for project managers and employees.  
It combines **Google Sheets Integration**, **Dynamic Performance Dashboards**, and **Role-based Access** for effective monitoring.

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

### 📊 Sample Dashboard (Team Member View)
<div align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Performance+Dashboard+Preview" alt="Dashboard Preview" />
</div>

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
