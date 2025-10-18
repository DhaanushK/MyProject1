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
  const itemsPerPage = 10; // Show 10 dates per page

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

  const metricsData = calculateMetrics();
  const taskCompletion = [
    { name: "Completed", value: metricsData.completedTasks },
    { name: "Pending", value: metricsData.pendingTasks }
  ];

  // Prepare weekly data using simple for loop
  const weeklyData = {};
  for (let i = 0; i < metrics.length; i++) {
    const metric = metrics[i];
    const date = new Date(metric.date);
    const weekNumber = Math.ceil((date.getDate()) / 7);
    const weekKey = `Week ${weekNumber}`;
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { completed: 0, total: 0 };
    }
    weeklyData[weekKey].completed += metric.completed;
    weeklyData[weekKey].total += metric.totalTasks;
  }

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

      {/* Removed old Performance Analysis Link Section */}

      {/* Metrics Data Table with Pagination */}
      <div style={{ marginTop: "30px" }}>
        <h3>Metrics Data</h3>
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
                {metrics
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((metric, index) => (
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

