import { useState, useEffect } from "react";
import axios from "../config/axios";

// Add loading spinner animation
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Add the style to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = spinnerStyle;
document.head.appendChild(styleSheet);
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, ResponsiveContainer
} from "recharts";

export default function TeamMemberTabs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, profile

  useEffect(() => {
    console.log('=== TeamMemberTabs component mounted ===');
    fetchTeamData();
  }, []);

  useEffect(() => {
    if (teamData) {
      console.log('Team Data updated:', teamData);
      // Set first team member as active tab if none is selected
      if (!activeTab && teamData.teamMembers && teamData.teamMembers.length > 0) {
        console.log('Setting active tab to first team member:', teamData.teamMembers[0]);
        setActiveTab(teamData.teamMembers[0]);
      }
    }
  }, [teamData, activeTab]);

  const fetchTeamData = async () => {
    const retryDelay = 2000; // 2 seconds
    const maxRetries = 3;
    let retries = 0;

    const attemptFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`=== TeamMemberTabs: Making API call to /api/metrics/all (Attempt ${retries + 1}/${maxRetries}) ===`);
        const response = await axios.get('/api/metrics/all', {
          timeout: 60000, // 60 second timeout
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.data) {
          throw new Error('No data received from server');
        }

        console.log('=== TeamMemberTabs: Received response ===', response.data);
        
        // Validate the response structure
        if (!response.data.teamMembers || !Array.isArray(response.data.teamMembers)) {
          throw new Error('Invalid data format: missing team members array');
        }

        if (!response.data.userMetrics || !response.data.individualKPIs) {
          throw new Error('Invalid data format: missing metrics or KPIs data');
        }

        setTeamData(response.data);
        
        // Set first team member as active tab
        if (response.data.teamMembers.length > 0) {
          const firstMember = response.data.teamMembers[0];
          console.log('Setting active tab to:', firstMember);
          setActiveTab(firstMember);
        } else {
          throw new Error('No team members found in data');
        }
      } catch (err) {
        console.error('Error fetching team metrics:', err);
        
        if (retries < maxRetries - 1) {
          retries++;
          console.log(`Retrying in ${retryDelay}ms... (Attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptFetch();
        }
        
        setError(err.response?.data?.message || err.message || 'Failed to load team metrics');
      } finally {
        setLoading(false);
      }
    };

    await attemptFetch();
  };

  const getMemberData = (memberName) => {
    if (!teamData?.userMetrics || !memberName) return [];
    const memberData = teamData.userMetrics[memberName] || [];
    console.log('Member Data for', memberName, ':', memberData);
    return memberData;
  };

  const getMemberKPIs = (memberName) => {
    if (!teamData?.individualKPIs || !memberName) return {};
    const kpis = teamData.individualKPIs[memberName] || {};
    console.log('KPIs for', memberName, ':', kpis);
    return kpis;
  };

  const processWeeklyData = (memberData) => {
    if (!memberData || memberData.length === 0) return [];
    
    // Group by date and calculate daily totals
    const dailyData = {};
    
    for (let i = 0; i < memberData.length; i++) {
      const entry = memberData[i];
      if (entry.date) {
        const date = new Date(entry.date).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            completed: 0,
            assigned: 0,
            late: 0,
            interactions: 0
          };
        }
        dailyData[date].completed += entry.completed;
        dailyData[date].assigned += entry.totalTasks;
        dailyData[date].late += entry.late;
        dailyData[date].interactions += entry.clientInteractions;
      }
    }

    const result = [];
    for (const key in dailyData) {
      result.push(dailyData[key]);
    }
    return result.slice(-7); // Last 7 days
  };

  const renderDailyPerformance = (memberName) => {
    const memberData = getMemberData(memberName);
    const memberKPIs = getMemberKPIs(memberName);
    const weeklyData = processWeeklyData(memberData);

    return (
      <div style={{ padding: "20px" }}>
        <h3>Daily Performance - {memberName}</h3>
        
        {/* KPI Cards */}
        <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <div style={{ background: "#e3f2fd", padding: "15px", borderRadius: "8px", minWidth: "150px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Total Tasks</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
              {memberKPIs.totalTasks || 0}
            </p>
          </div>
          <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "8px", minWidth: "150px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Completed</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
              {memberKPIs.completedTasks || 0}
            </p>
          </div>
          <div style={{ background: "#fff3e0", padding: "15px", borderRadius: "8px", minWidth: "150px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Completion Rate</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
              {memberKPIs.completionRate || 0}%
            </p>
          </div>
          <div style={{ background: "#ffebee", padding: "15px", borderRadius: "8px", minWidth: "150px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Late Tasks</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
              {memberKPIs.lateTasks || 0}
            </p>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div style={{ marginBottom: "30px" }}>
          <h4>Daily Performance Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#4caf50" name="Completed" />
              <Line type="monotone" dataKey="assigned" stroke="#2196f3" name="Assigned" />
              <Line type="monotone" dataKey="late" stroke="#f44336" name="Late" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderWeeklyAnalysis = (memberName) => {
    const memberData = getMemberData(memberName);
    const memberKPIs = getMemberKPIs(memberName);
    const weeklyData = processWeeklyData(memberData);

    // Task distribution for pie chart
    const taskDistribution = [
      { name: "Completed", value: memberKPIs.completedTasks || 0, color: "#4caf50" },
      { name: "Pending", value: memberKPIs.pendingTasks || 0, color: "#ff9800" },
      { name: "Late", value: memberKPIs.lateTasks || 0, color: "#f44336" }
    ];

    return (
      <div style={{ padding: "20px" }}>
        <h3>Weekly Analysis - {memberName}</h3>
        
        <div style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
          {/* Task Distribution Pie Chart */}
          <div style={{ flex: 1 }}>
            <h4>Task Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics Bar Chart */}
          <div style={{ flex: 1 }}>
            <h4>Performance Metrics</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                <Bar dataKey="interactions" fill="#2196f3" name="Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Summary */}
        <div style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
          <h4>Weekly Summary</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <strong>Total Tasks This Week:</strong> {memberKPIs.totalTasks || 0}
            </div>
            <div>
              <strong>Average Completion Rate:</strong> {memberKPIs.completionRate || 0}%
            </div>
            <div>
              <strong>Client Interactions:</strong> {memberKPIs.totalClientInteractions || 0}
            </div>
            <div>
              <strong>Efficiency Score:</strong> {memberKPIs.efficiency || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceProfile = (memberName) => {
    const memberKPIs = getMemberKPIs(memberName);
    const memberData = getMemberData(memberName);

    // Calculate trends
    const totalEntries = memberData.length;
    const avgTasksPerDay = totalEntries > 0 ? (memberKPIs.totalTasks / totalEntries).toFixed(1) : 0;
    const avgCompletionRate = memberKPIs.completionRate || 0;

    return (
      <div style={{ padding: "20px" }}>
        <h3>Performance Profile - {memberName}</h3>
        
        {/* Profile Overview */}
        <div style={{ backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <h4>Overall Performance Overview</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div>
              <strong>Total Entries:</strong> {totalEntries}
            </div>
            <div>
              <strong>Average Tasks per Day:</strong> {avgTasksPerDay}
            </div>
            <div>
              <strong>Overall Completion Rate:</strong> {avgCompletionRate}%
            </div>
            <div>
              <strong>Total Client Interactions:</strong> {memberKPIs.totalClientInteractions || 0}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          {/* Efficiency Metrics */}
          <div style={{ backgroundColor: "#fff", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h4>Efficiency Metrics</h4>
            <div style={{ marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span>Task Completion</span>
                <span>{avgCompletionRate}%</span>
              </div>
              <div style={{ 
                width: "100%", 
                height: "10px", 
                backgroundColor: "#eee", 
                borderRadius: "5px",
                overflow: "hidden"
              }}>
                <div style={{ 
                  width: `${avgCompletionRate}%`, 
                  height: "100%", 
                  backgroundColor: avgCompletionRate >= 80 ? "#4caf50" : avgCompletionRate >= 60 ? "#ff9800" : "#f44336",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span>Quality Score</span>
                <span>{memberKPIs.lateTasks === 0 ? "100%" : `${Math.max(0, 100 - (memberKPIs.lateTasks * 10))}%`}</span>
              </div>
              <div style={{ 
                width: "100%", 
                height: "10px", 
                backgroundColor: "#eee", 
                borderRadius: "5px",
                overflow: "hidden"
              }}>
                <div style={{ 
                  width: `${memberKPIs.lateTasks === 0 ? 100 : Math.max(0, 100 - (memberKPIs.lateTasks * 10))}%`, 
                  height: "100%", 
                  backgroundColor: memberKPIs.lateTasks === 0 ? "#4caf50" : memberKPIs.lateTasks < 3 ? "#ff9800" : "#f44336",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div style={{ backgroundColor: "#fff", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h4>Performance Highlights</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "10px", padding: "8px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
                ✅ Completed {memberKPIs.completedTasks || 0} tasks
              </li>
              <li style={{ marginBottom: "10px", padding: "8px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                📞 {memberKPIs.totalClientInteractions || 0} client interactions
              </li>
              {memberKPIs.lateTasks > 0 && (
                <li style={{ marginBottom: "10px", padding: "8px", backgroundColor: "#ffebee", borderRadius: "4px" }}>
                  ⚠️ {memberKPIs.lateTasks} late submissions
                </li>
              )}
              <li style={{ marginBottom: "10px", padding: "8px", backgroundColor: "#f3e5f5", borderRadius: "4px" }}>
                📊 Efficiency: {memberKPIs.efficiency || 0}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ 
          color: "#d32f2f",
          padding: "20px",
          background: "#ffebee",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Error Loading Data</h3>
          <p style={{ marginBottom: "15px" }}>{error}</p>
          <button 
            onClick={fetchTeamData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#1565c0'}
            onMouseOut={e => e.target.style.backgroundColor = '#1976d2'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get team members from the data
  const teamMembers = teamData?.teamMembers || [];
  
  if (!teamData || !activeTab || teamMembers.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>No team members found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Team Members Performance Analysis</h2>
      
      {/* Member Tabs */}
      <div style={{ 
        borderBottom: "2px solid #ddd", 
        marginBottom: "20px",
        display: "flex",
        overflowX: "auto",
        gap: "10px"
      }}>
        {teamMembers.map(member => (
          <button
            key={member}
            onClick={() => setActiveTab(member)}
            style={{
              padding: "12px 20px",
              border: "none",
              backgroundColor: activeTab === member ? "#2196f3" : "#f5f5f5",
              color: activeTab === member ? "white" : "#333",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontWeight: activeTab === member ? "bold" : "normal",
              minWidth: "120px",
              whiteSpace: "nowrap"
            }}
          >
            {member}
          </button>
        ))}
      </div>

      {/* View Mode Tabs */}
      {activeTab && (
        <div style={{ 
          marginBottom: "20px",
          display: "flex",
          gap: "10px"
        }}>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              backgroundColor: viewMode === 'daily' ? "#4caf50" : "white",
              color: viewMode === 'daily' ? "white" : "#333",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Daily Performance
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              backgroundColor: viewMode === 'weekly' ? "#4caf50" : "white",
              color: viewMode === 'weekly' ? "white" : "#333",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Weekly Analysis
          </button>
          <button
            onClick={() => setViewMode('profile')}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              backgroundColor: viewMode === 'profile' ? "#4caf50" : "white",
              color: viewMode === 'profile' ? "white" : "#333",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Performance Profile
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          {viewMode === 'daily' && renderDailyPerformance(activeTab)}
          {viewMode === 'weekly' && renderWeeklyAnalysis(activeTab)}
          {viewMode === 'profile' && renderPerformanceProfile(activeTab)}
        </div>
      )}
    </div>
  );
}