import { useState } from "react";
import IndividualDashboard from "../components/IndividualDashboard";
import MetricsSubmissionForm from "../components/MetricsSubmissionForm";
import TeamMemberEmailDashboard from "../components/TeamMemberEmailDashboard";
import TopBar from "../components/TopBar";

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar 
        title="Team Member Dashboard" 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="team_member"
      />
      <div style={{ padding: "20px" }}>
        {activeTab === 'dashboard' && (
          <>
            <MetricsSubmissionForm />
            <IndividualDashboard />
          </>
        )}
        {activeTab === 'email' && <TeamMemberEmailDashboard />}
      </div>
    </div>
  );
}