import { useState } from "react";
import TeamMemberTabs from "../components/TeamMemberTabs.jsx";
import TopBar from "../components/TopBar";
import ActivityLogs from "../components/ActivityLogs.jsx";

export default function PMDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <TopBar 
        title="Project Manager Dashboard" 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="project_manager"
      />

      <div style={{ padding: "20px" }}>
        {/* Render content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Team Member Performance Analysis */}
            <TeamMemberTabs />

            <div
              style={{
                marginTop: "40px",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
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
                  marginBottom: "20px",
                  boxShadow: "0 2px 4px rgba(76,175,80,0.2)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#43a047";
                  e.currentTarget.style.boxShadow =
                    "0 4px 8px rgba(76,175,80,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#4caf50";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(76,175,80,0.2)";
                }}
              >
                📥 Download Google Sheet (Excel)
              </button>

              {/* Embedded Google Sheet */}
              <iframe
                src="https://docs.google.com/spreadsheets/d/1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80/edit?usp=sharing"
                width="100%"
                height="600px"
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
                }}
                title="Metrics Sheet"
              />
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>📊 Performance Analysis</h2>
            <TeamMemberTabs />
          </div>
        )}

        {activeTab === 'activity-logs' && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>📋 Activity Logs</h2>
            <ActivityLogs />
          </div>
        )}
      </div>
    </div>
  );
}
