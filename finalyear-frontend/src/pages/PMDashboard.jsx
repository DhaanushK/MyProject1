import { useState } from "react";
import TeamMemberTabs from "../components/TeamMemberTabs.jsx";
import TopBar from "../components/TopBar";
import ActivityLogs from "../components/ActivityLogs.jsx";
import ProjectManagerEmailDashboard from "../components/ProjectManagerEmailDashboard.jsx";
import GoogleSheetAccess from "../components/GoogleSheetAccess.jsx";


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
            
            {/* Google Sheets Access */}
            <div className="mt-8">
              <GoogleSheetAccess />
            </div>


          </>
        )}

        {activeTab === 'performance' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>📊 Performance Analysis</h2>
            <TeamMemberTabs />
          </div>
        )}

        {activeTab === 'activity-logs' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>📋 Activity Logs</h2>
            <ActivityLogs />
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>📧 Email Dashboard</h2>
            <ProjectManagerEmailDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
