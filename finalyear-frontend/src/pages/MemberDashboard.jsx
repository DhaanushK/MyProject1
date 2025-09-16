import UserInfo from "../components/UserInfo";
import IndividualDashboard from "../components/IndividualDashboard";

export default function MemberDashboard() {
  return (
    <div>
      <UserInfo />
      <h1>Team Member Dashboard</h1>
      <div style={{ padding: "20px" }}>
        <IndividualDashboard />
      </div>
    </div>
  );
}