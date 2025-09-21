import { useState } from "react";
import IndividualDashboard from "../components/IndividualDashboard";
import MetricsSubmissionForm from "../components/MetricsSubmissionForm";
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
        <MetricsSubmissionForm />
        <IndividualDashboard />
      </div>
    </div>
  );
}