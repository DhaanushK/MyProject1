import { useState } from "react";
import TopBar from "../components/TopBar";
import TeamLeadMetrics from "../components/TeamLeadMetrics";
import MetricsSubmissionForm from "../components/MetricsSubmissionForm";
import ActivityLogs from "../components/ActivityLogs";
import TeamLeaderEmailDashboard from "../components/TeamLeaderEmailDashboard";

export default function LeadDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar 
        title="Team Lead Dashboard" 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="team_lead"
      />
      
      <div style={{ padding: "20px" }}>
        {/* Render content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            <MetricsSubmissionForm />
            <TeamLeadMetrics />
          </>
        )}

        {activeTab === 'email' && (
          <div>
            <TeamLeaderEmailDashboard />
          </div>
        )}

        {activeTab === 'activity-logs' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>📋 Activity Logs</h2>
            <ActivityLogs />
          </div>
        )}
      </div>
    </div>
  );
}