import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';

export default function IndividualDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const COLORS = ["#00C49F", "#FF8042"];

  useEffect(() => {
    const fetchUserMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        console.log('Fetching metrics for user:', username);
        console.log('Token exists:', !!token);
        
        const response = await axios.get('/api/metrics/user', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API Response:', response.data);
        if (!response.data.metrics || response.data.metrics.length === 0) {
          console.warn('No metrics data received');
        }
        
        setMetrics(response.data.metrics || []);
        setUserName(response.data.userName || username || '');
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Calculate basic metrics for the summary
  const calculateMetrics = () => {
    if (!Array.isArray(metrics)) {
      console.warn('Metrics is not an array:', metrics);
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        lateTasks: 0,
        completionRate: 0,
        lateRate: 0
      };
    }

    const totalTasks = metrics.reduce((sum, m) => sum + (m.totalTasks || 0), 0);
    const completedTasks = metrics.reduce((sum, m) => sum + (m.completed || 0), 0);
    const pendingTasks = totalTasks - completedTasks;
    const lateTasks = metrics.reduce((sum, m) => sum + (m.late || 0), 0);
    
    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      lateTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      lateRate: totalTasks ? Math.round((lateTasks / totalTasks) * 100) : 0
    };
  };

  const metricsData = calculateMetrics();
  const taskCompletion = [
    { name: "Completed", value: metricsData.completedTasks },
    { name: "Pending", value: metricsData.pendingTasks }
  ];

  // Pagination logic
  const totalPages = Math.ceil(metrics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMetrics = metrics.slice(startIndex, endIndex);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // Prepare weekly data
  const weeklyData = metrics.reduce((acc, metric) => {
    const date = new Date(metric.date);
    const weekNumber = Math.ceil((date.getDate()) / 7);
    const weekKey = `Week ${weekNumber}`;
    
    if (!acc[weekKey]) {
      acc[weekKey] = { completed: 0, total: 0 };
    }
    acc[weekKey].completed += metric.completed;
    acc[weekKey].total += metric.totalTasks;
    return acc;
  }, {});

  const weeklyChartData = Object.entries(weeklyData).map(([week, data]) => ({
    week,
    completed: data.completed,
    total: data.total
  }));

  return (
    <div style={{ padding: "20px" }}>
      <h2>{userName}'s Performance Dashboard</h2>

      {/* KPI Tiles */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        marginBottom: "20px"
      }}>
        <div style={{ background: "#e0f7fa", padding: "15px", borderRadius: "10px" }}>
          <h3>Completion Rate</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>{metricsData.completionRate}%</p>
        </div>
        <div style={{ background: "#fff3e0", padding: "15px", borderRadius: "10px" }}>
          <h3>Late Submission Rate</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>{metricsData.lateRate}%</p>
        </div>
        <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "10px" }}>
          <h3>Total Tasks</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>{metricsData.totalTasks}</p>
        </div>
      </div>

      {/* Performance Analysis Link Section */}
      <div 
        style={{ 
          marginTop: "40px",
          background: "white",
          borderRadius: "10px",
          padding: "20px",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
        onClick={() => navigate('performance')}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        }}
      >
        <h2 style={{ marginBottom: "15px", color: "#333" }}>Performance Analysis</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Click to view detailed performance analytics and visualizations in a new tab
        </p>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "15px"
        }}>
          <div style={{ 
            background: "#f8f9fa",
            borderRadius: "5px",
            padding: "15px",
            textAlign: "center"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#444" }}>Daily Performance</h4>
            <p style={{ color: "#666", margin: 0 }}>View daily workload and SLA trends</p>
          </div>
          <div style={{ 
            background: "#f8f9fa",
            borderRadius: "5px",
            padding: "15px",
            textAlign: "center"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#444" }}>Weekly Analysis</h4>
            <p style={{ color: "#666", margin: 0 }}>Track weekly performance metrics</p>
          </div>
          <div style={{ 
            background: "#f8f9fa",
            borderRadius: "5px",
            padding: "15px",
            textAlign: "center"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#444" }}>Performance Profile</h4>
            <p style={{ color: "#666", margin: 0 }}>Analyze overall efficiency metrics</p>
          </div>
        </div>
      </div>

      {/* Metrics Data Table with Pagination */}
      <div style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>Metrics Data</h3>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Showing {startIndex + 1} to {Math.min(endIndex, metrics.length)} of {metrics.length} entries
          </div>
        </div>
        
        {metrics.length > 0 ? (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>Total Tasks</th>
                  <th style={tableHeaderStyle}>Completed</th>
                  <th style={tableHeaderStyle}>Pending</th>
                  <th style={tableHeaderStyle}>Late</th>
                  <th style={tableHeaderStyle}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {currentMetrics.map((metric, index) => (
                  <tr key={index}>
                    <td style={tableCellStyle}>{metric.date}</td>
                    <td style={tableCellStyle}>{metric.totalTasks}</td>
                    <td style={tableCellStyle}>{metric.completed}</td>
                    <td style={tableCellStyle}>{metric.pending}</td>
                    <td style={tableCellStyle}>{metric.late}</td>
                    <td style={tableCellStyle}>{metric.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                marginTop: "20px",
                gap: "10px"
              }}>
                {/* Previous Button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
                    color: currentPage === 1 ? "#999" : "#333",
                    borderRadius: "4px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      backgroundColor: currentPage === pageNumber ? "#007bff" : "#fff",
                      color: currentPage === pageNumber ? "#fff" : "#333",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: currentPage === pageNumber ? "bold" : "normal"
                    }}
                  >
                    {pageNumber}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#fff",
                    color: currentPage === totalPages ? "#999" : "#333",
                    borderRadius: "4px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No metrics data available</p>
        )}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  backgroundColor: "#f5f5f5",
  padding: "12px",
  textAlign: "left",
  borderBottom: "2px solid #ddd"
};

const tableCellStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd"
};

