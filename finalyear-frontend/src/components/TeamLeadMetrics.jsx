import { useState, useEffect } from 'react';
import axios from '../config/axios';

const styles = {
  container: {
    padding: '20px'
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "30px"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  cardTitle: {
    margin: "0 0 10px 0",
    color: "#333"
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    padding: "12px 15px",
    textAlign: "left",
    borderBottom: "2px solid #dee2e6",
    color: "#333"
  },
  tableCell: {
    padding: "12px 15px",
    borderBottom: "1px solid #dee2e6",
    color: "#666"
  },
  errorMessage: {
    color: 'red',
    padding: '20px',
    backgroundColor: '#fff3f3',
    borderRadius: '4px',
    marginBottom: '20px'
  }
};

export default function TeamLeadMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTeamLeadMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        
        const response = await axios.get('/api/metrics/user', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.data.metrics || response.data.metrics.length === 0) {
          console.warn('No metrics data received');
        }
        
        setMetrics(response.data.metrics || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTeamLeadMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Calculate metrics summary
  const calculateSummary = () => {
    if (!Array.isArray(metrics)) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        lateTasks: 0,
        completionRate: 0,
        lateRate: 0
      };
    }

    // Use simple for loop
    let totalTasks = 0;
    let completedTasks = 0;
    let lateTasks = 0;
    
    for (let i = 0; i < metrics.length; i++) {
      const m = metrics[i];
      totalTasks += m.totalTasks || 0;
      completedTasks += m.completed || 0;
      lateTasks += m.late || 0;
    }
    
    const pendingTasks = totalTasks - completedTasks;
    
    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      lateTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      lateRate: totalTasks ? Math.round((lateTasks / totalTasks) * 100) : 0
    };
  };

  const summary = calculateSummary();

  return (
    <div>
      {/* KPI Summary */}
      <div style={styles.gridContainer}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Task Completion</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4caf50" }}>
            {summary.completionRate}%
          </div>
          <div style={{ color: "#666", fontSize: "14px" }}>
            {summary.completedTasks} of {summary.totalTasks} tasks completed
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Late Tasks</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f44336" }}>
            {summary.lateRate}%
          </div>
          <div style={{ color: "#666", fontSize: "14px" }}>
            {summary.lateTasks} tasks submitted late
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Pending Tasks</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff9800" }}>
            {summary.pendingTasks}
          </div>
          <div style={{ color: "#666", fontSize: "14px" }}>
            Tasks awaiting completion
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div style={{ 
        background: "white", 
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>Detailed Metrics</h3>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Total Tasks</th>
                <th style={styles.tableHeader}>Completed</th>
                <th style={styles.tableHeader}>Pending</th>
                <th style={styles.tableHeader}>Late</th>
                <th style={styles.tableHeader}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {metrics
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((metric, index) => (
                  <tr key={index}>
                    <td style={styles.tableCell}>{metric.date}</td>
                    <td style={styles.tableCell}>{metric.totalTasks}</td>
                    <td style={styles.tableCell}>{metric.completed}</td>
                    <td style={styles.tableCell}>{metric.pending}</td>
                    <td style={styles.tableCell}>{metric.late}</td>
                    <td style={styles.tableCell}>{metric.notes}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {metrics.length > itemsPerPage && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '10px', 
            marginTop: '20px',
            alignItems: 'center'
          }}>
            {Array.from({ length: Math.ceil(metrics.length / itemsPerPage) }, (_, i) => i + 1)
              .map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '8px 12px',
                    border: currentPage === pageNum ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    background: currentPage === pageNum ? '#007bff' : 'white',
                    color: currentPage === pageNum ? 'white' : '#333',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    minWidth: '40px'
                  }}
                >
                  {pageNum}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Embedded Google Sheet */}
      <div style={{ 
        marginTop: "30px",
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>Whole Team's Metrics</h3>
        <iframe
          src={`https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID'}/edit?usp=sharing`}
          width="100%"
          height="600px"
          style={{ 
            border: "1px solid #eee", 
            borderRadius: "8px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)"
          }}
          title="Team Lead Metrics Sheet"
        />
      </div>
    </div>
  );
}

