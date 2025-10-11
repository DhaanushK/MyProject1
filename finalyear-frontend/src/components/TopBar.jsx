import LogoutButton from "./LogoutButton";

export default function TopBar({ title, activeTab, setActiveTab, userRole }) {
  const userName = localStorage.getItem('username');
  const role = localStorage.getItem('role')?.replace('_', ' ');

  // Define available tabs based on user role
  const getAvailableTabs = () => {
    const commonTabs = [{ id: 'dashboard', label: 'Dashboard' }];
    
    if (userRole === 'project_manager') {
      return [
        ...commonTabs,
        { id: 'performance', label: 'Performance Analysis' },
        { id: 'email', label: 'Email Management' },
        { id: 'activity-logs', label: 'Activity Logs' }
      ];
    } else if (userRole === 'team_lead') {
      return [
        ...commonTabs,
        { id: 'email', label: 'Email Management' },
        { id: 'activity-logs', label: 'Activity Logs' }
      ];
    } else if (userRole === 'team_member') {
      return [
        ...commonTabs,
        { id: 'email', label: 'Email & Support' }
      ];
    } else {
      return commonTabs;
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <div style={{
      width: "100%",
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      marginBottom: "20px"
    }}>
      {/* Main header row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: availableTabs.length > 1 ? "1px solid #eee" : "none"
      }}>
        {/* Left side - Title */}
        <h1 style={{
          margin: 0,
          fontSize: "24px",
          color: "#333",
          fontWeight: "bold"
        }}>
          {title}
        </h1>

        {/* Right side - User info and Logout */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "20px"
        }}>
          <div style={{
            backgroundColor: "#f8f9fa",
            padding: "8px 16px",
            borderRadius: "4px"
          }}>
            <span style={{
              fontSize: "14px",
              color: "#666"
            }}>
              Currently logged in: <strong>{userName}</strong> ({role})
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Navigation tabs */}
      {availableTabs.length > 1 && (
        <div style={{
          display: "flex",
          padding: "0 24px",
          backgroundColor: "#f8f9fa"
        }}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab && setActiveTab(tab.id)}
              style={{
                padding: "12px 20px",
                border: "none",
                backgroundColor: activeTab === tab.id ? "#fff" : "transparent",
                color: activeTab === tab.id ? "#007bff" : "#666",
                fontWeight: activeTab === tab.id ? "600" : "normal",
                cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                marginRight: "4px",
                borderBottom: activeTab === tab.id ? "2px solid #007bff" : "2px solid transparent",
                transition: "all 0.2s ease",
                fontSize: "14px"
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = "#e9ecef";
                  e.target.style.color = "#495057";
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }
              }}
            >
              {tab.id === 'dashboard' && '🏠 '}
              {tab.id === 'performance' && '📊 '}
              {tab.id === 'email' && '📧 '}
              {tab.id === 'activity-logs' && '📋 '}
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}