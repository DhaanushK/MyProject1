import LogoutButton from "./LogoutButton";

export default function TopBar({ title }) {
  const userName = localStorage.getItem('username');
  const role = localStorage.getItem('role')?.replace('_', ' ');

  return (
    <div style={{
      width: "100%",
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      marginBottom: "20px",
      padding: "16px 24px"
    }}>
      {/* Main header row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px"
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
    </div>
  );
}