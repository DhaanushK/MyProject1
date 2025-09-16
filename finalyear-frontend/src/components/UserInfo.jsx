export default function UserInfo() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (!username || !role) {
    return <p style={{ color: "red" }}>⚠️ No user logged in</p>;
  }

  return (
    <div style={{ background: "#f5f5f5", padding: "10px", marginBottom: "20px" }}>
      <strong>Currently logged in:</strong> {username} ({role})
    </div>
  );
}
