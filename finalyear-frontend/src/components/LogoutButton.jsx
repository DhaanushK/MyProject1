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
        padding: "8px 16px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        transition: "background-color 0.2s",
        marginLeft: "auto"
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
    >
      Logout
    </button>
  );
}
