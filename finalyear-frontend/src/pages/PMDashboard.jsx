import UserInfo from "../components/UserInfo";
import TeamMemberTabs from "../components/TeamMemberTabs.jsx";
export default function PMDashboard() {
  const handleDownload = () => {
    const sheetId = "1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80"; // Replace with your Google Sheet ID
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    // Trigger download
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Download failed");
        }
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "metrics.xlsx"; // filename
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        console.error("Download error:", err);
        alert("Error downloading Google Sheet");
      });
  };

  return (
    <div>
      <UserInfo />
      <h1>Project Manager Dashboard</h1>
      
      {/* Team Member Performance Analysis */}
      <TeamMemberTabs />
      
      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <h3>📄 Raw Data Access</h3>
        <p>Download or view the complete Google Sheets data:</p>
        
        {/* Button for Google Sheet download */}
        <button 
          onClick={handleDownload}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "20px"
          }}
        >
          📥 Download Google Sheet (Excel)
        </button>

        {/* Embedded Google Sheet */}
        <iframe
          src="https://docs.google.com/spreadsheets/d/1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80/edit?usp=sharing"
          width="100%"
          height="600px"
          style={{ border: "1px solid #ccc", borderRadius: "8px" }}
          title="Metrics Sheet"
        ></iframe>
      </div>
    </div>
  );
}
