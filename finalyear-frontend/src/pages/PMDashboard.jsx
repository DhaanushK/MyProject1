import { useState } from "react";
import TeamMemberTabs from "../components/TeamMemberTabs.jsx";
import TopBar from "../components/TopBar";
import ActivityLogs from "../components/ActivityLogs.jsx";
import ProjectManagerEmailDashboard from "../components/ProjectManagerEmailDashboard.jsx";
import GoogleSheetAccess from "../components/GoogleSheetAccess.jsx";
import GoogleSheetsViewer from "../components/GoogleSheetsViewer.jsx";


// Internal Google Sheets Tab Component
function GoogleSheetsTab() {
  const [sheetsSubTab, setSheetsSubTab] = useState('viewer');

  return (
    <div>
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        <i className="fas fa-file-excel mr-2"></i> Google Sheets
      </h2>
      
      {/* Internal navigation for Google Sheets */}
      <div style={{
        display: "flex",
        marginBottom: "20px",
        borderBottom: "2px solid #eee",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px 8px 0 0"
      }}>
        <button
          onClick={() => setSheetsSubTab('viewer')}
          style={{
            padding: "12px 24px",
            border: "none",
            backgroundColor: sheetsSubTab === 'viewer' ? "#fff" : "transparent",
            color: sheetsSubTab === 'viewer' ? "#007bff" : "#666",
            fontWeight: sheetsSubTab === 'viewer' ? "600" : "normal",
            cursor: "pointer",
            borderRadius: "8px 0 0 0",
            borderBottom: sheetsSubTab === 'viewer' ? "2px solid #007bff" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontSize: "14px"
          }}
        >
          <i className="fas fa-table mr-2"></i> View Sheets
        </button>
        <button
          onClick={() => setSheetsSubTab('data')}
          style={{
            padding: "12px 24px",
            border: "none",
            backgroundColor: sheetsSubTab === 'data' ? "#fff" : "transparent",
            color: sheetsSubTab === 'data' ? "#007bff" : "#666",
            fontWeight: sheetsSubTab === 'data' ? "600" : "normal",
            cursor: "pointer",
            borderRadius: "0 8px 0 0",
            borderBottom: sheetsSubTab === 'data' ? "2px solid #007bff" : "2px solid transparent",
            transition: "all 0.2s ease",
            fontSize: "14px"
          }}
        >
          <i className="fas fa-download mr-2"></i> Raw Data Access
        </button>
      </div>

      {/* Content based on selected sub-tab */}
      {sheetsSubTab === 'viewer' && (
        <div>
          <GoogleSheetsViewer />
        </div>
      )}
      
      {sheetsSubTab === 'data' && (
        <div>
          <GoogleSheetAccess />
        </div>
      )}
    </div>
  );
}

export default function PMDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');



  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar 
        title="Project Manager Dashboard" 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="project_manager"
      />

      <div style={{ padding: "20px" }}>
        {/* Render content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Team Member Performance Analysis */}
            <TeamMemberTabs />
          </>
        )}

        {activeTab === 'performance' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>
              <i className="fas fa-chart-bar mr-2"></i> Performance Analysis
            </h2>
            <TeamMemberTabs />
          </div>
        )}

        {activeTab === 'sheets' && <GoogleSheetsTab />}

        {activeTab === 'activity-logs' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>
              <i className="fas fa-list-ul mr-2"></i> Activity Logs
            </h2>
            <ActivityLogs />
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>
              <i className="fas fa-envelope mr-2"></i> Email Dashboard</h2>
            <ProjectManagerEmailDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
