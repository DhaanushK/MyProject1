import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <button 
      onClick={handleLogout}
      style={{
        padding: "8px 20px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        fontSize: "14px",
        boxShadow: "0 2px 4px rgba(220,53,69,0.2)",
        transition: "all 0.2s ease"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = "#c82333";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(220,53,69,0.3)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "#dc3545";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(220,53,69,0.2)";
      }}
    >
      Logout
    </button>
  );
}
