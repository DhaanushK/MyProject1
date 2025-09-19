import TopBar from "../components/TopBar";
import TeamLeadMetrics from "../components/TeamLeadMetrics";
import MetricsSubmissionForm from "../components/MetricsSubmissionForm";

export default function LeadDashboard() {
  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar title="Team Lead Dashboard" />
      <div style={{ padding: "20px" }}>
        <MetricsSubmissionForm />
        <TeamLeadMetrics />
      </div>
    </div>
  );
}