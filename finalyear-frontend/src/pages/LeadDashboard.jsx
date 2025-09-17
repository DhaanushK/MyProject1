import TopBar from "../components/TopBar";
import TeamLeadMetrics from "../components/TeamLeadMetrics";

export default function LeadDashboard() {
  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar title="Team Lead Dashboard" />
      <div style={{ padding: "20px" }}>
        <TeamLeadMetrics />
      </div>
    </div>
  );
}