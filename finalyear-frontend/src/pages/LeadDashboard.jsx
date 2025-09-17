import UserInfo from "../components/UserInfo";
import TopBar from "../components/TopBar";

export default function LeadDashboard() {
  return (
    <div>
      <TopBar title="Team Lead Dashboard">
        <UserInfo />
      </TopBar>
    </div>
  );
}