import UserInfo from "../components/UserInfo";
import IndividualDashboard from "../components/IndividualDashboard";
import TopBar from "../components/TopBar";

export default function MemberDashboard() {
  return (
    <div>
      <TopBar title="Team Member Dashboard">
        <UserInfo />
      </TopBar>
      <div style={{ padding: "20px" }}>
        <IndividualDashboard />
      </div>
    </div>
  );
}