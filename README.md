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

<h3>🛠️ Tech Stack</h3>

<ol>
  <li><b>🎨 Frontend</b>
    <ul>
      <li>⚛️ React 19 – UI Library</li>
      <li>⚡ Vite 7 – Dev Server / Bundler</li>
      <li>🛣️ React Router DOM 7 – Client Side Routing</li>
      <li>🌐 Axios – HTTP Client for API Calls</li>
      <li>📊 Recharts 3 – Data Visualization</li>
      <li>✨ JSX + ES Modules – Modern Frontend Syntax</li>
    </ul>
  </li>

  <li><b>🖥️ Backend</b>
    <ul>
      <li>🟢 Node.js – Runtime Environment</li>
      <li>🚏 Express 5 – Web Framework / HTTP Server</li>
      <li>🔗 CORS – Cross-origin Resource Handling</li>
      <li>🔐 JSON Web Tokens – Stateless Authentication</li>
      <li>🔑 bcryptjs – Password Hashing</li>
      <li>🗄️ Mongoose – ODM for MongoDB</li>
      <li>📧 Nodemailer – Email Sending Capability</li>
      <li>⚙️ Dotenv – Environment Variable Management</li>
      <li>🧩 Modular Architecture – Routes, Models, Services, Utils</li>
    </ul>
  </li>

  <li><b>🗃️ Database</b>
    <ul>
      <li>🍃 MongoDB – Primary Database</li>
    </ul>
  </li>

  <li><b>🔌 Integration</b>
    <ul>
      <li>📑 Google Sheets API – For Reading and Appending Spreadsheet Data</li>
      <li>📂 ExcelJS (excel.js) – For Generating / Reading Excel Files Locally</li>
      <li>📧 Nodemailer</li>
    </ul>
  </li>
</ol>


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
