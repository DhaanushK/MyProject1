import IndividualDashboard from "../components/IndividualDashboard";
import TopBar from "../components/TopBar";

export default function MemberDashboard() {
  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar title="Team Member Dashboard" />
      <div style={{ padding: "20px" }}>
        <IndividualDashboard />
      </div>
    </div>
  );
}