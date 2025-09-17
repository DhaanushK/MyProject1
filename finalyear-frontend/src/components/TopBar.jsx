import LogoutButton from "./LogoutButton";

export default function TopBar({ title, children }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #dee2e6",
      marginBottom: "20px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#212529" }}>{title}</h1>
        {children}
      </div>
      <LogoutButton />
    </div>
  );
}