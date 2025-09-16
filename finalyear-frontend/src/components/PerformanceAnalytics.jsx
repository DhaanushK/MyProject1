import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import axios from '../config/axios';

export default function PerformanceAnalytics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const COLORS = ["#00C49F", "#FF8042"];

  useEffect(() => {
    const fetchUserMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        console.log('Fetching metrics for user:', username);
        
        const response = await axios.get('/api/metrics/user', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API Response:', response.data);
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

  // Process weekly metrics
  const processWeeklyMetrics = () => {
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    const weeklyData = metrics.reduce((acc, metric) => {
      const date = new Date(metric.date);
      const weekNumber = Math.ceil((date.getDate()) / 7);
      const weekKey = `Week ${weekNumber}`;
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          assigned: 0,
          resolved: 0,
          slaBreaches: 0,
          interactions: 0,
          responsiveness: 0
        };
      }

      acc[weekKey].assigned += metric.totalTasks;
      acc[weekKey].resolved += metric.completed;
      acc[weekKey].slaBreaches += metric.late;
      acc[weekKey].interactions += metric.interactions;
      acc[weekKey].responsiveness = (metric.completed / metric.totalTasks) * 100 || 0;

      return acc;
    }, {});

    return Object.values(weeklyData);
  };

  // Process daily heatmap data
  const processHeatmapData = () => {
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmapData = metrics.reduce((acc, metric) => {
      const date = new Date(metric.date);
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = {
          day: dayOfWeek,
          slaBreaches: 0,
          totalTasks: 0
        };
      }

      acc[dayOfWeek].slaBreaches += metric.late;
      acc[dayOfWeek].totalTasks += metric.totalTasks;
      acc[dayOfWeek].breachRate = (acc[dayOfWeek].slaBreaches / acc[dayOfWeek].totalTasks) * 100;

      return acc;
    }, {});

    return Object.values(heatmapData);
  };

  // Process radar chart data
  const processRadarData = () => {
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    const totalMetrics = metrics.reduce((acc, metric) => {
      acc.totalAssigned += metric.totalTasks;
      acc.totalResolved += metric.completed;
      acc.totalSLABreaches += metric.late;
      acc.totalInteractions += metric.interactions;
      return acc;
    }, { totalAssigned: 0, totalResolved: 0, totalSLABreaches: 0, totalInteractions: 0 });

    return [
      {
        metric: "Resolution Rate",
        value: (totalMetrics.totalResolved / totalMetrics.totalAssigned) * 100 || 0,
        fullMark: 100
      },
      {
        metric: "SLA Adherence",
        value: 100 - ((totalMetrics.totalSLABreaches / totalMetrics.totalAssigned) * 100) || 0,
        fullMark: 100
      },
      {
        metric: "Client Engagement",
        value: (totalMetrics.totalInteractions / totalMetrics.totalAssigned) * 100 || 0,
        fullMark: 100
      },
      {
        metric: "Responsiveness",
        value: (totalMetrics.totalResolved / totalMetrics.totalInteractions) * 100 || 0,
        fullMark: 100
      }
    ];
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div className="dashboard-header">
        <div className="user-info">
          <h4>Currently logged in: {userName} (team_member)</h4>
        </div>
        <h1>Team Member Dashboard</h1>
      </div>

      {/* Metrics Data Table */}
      <section className="analytics-section">
        <h2>Metrics Data</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Tasks</th>
                <th>Completed</th>
                <th>Pending</th>
                <th>Late</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.date}>
                  <td>{metric.date}</td>
                  <td>{metric.totalTasks}</td>
                  <td>{metric.completed}</td>
                  <td>{metric.totalTasks - metric.completed}</td>
                  <td>{metric.late}</td>
                  <td>{metric.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 style={{ margin: "40px 0 20px 0" }}>Performance Analysis</h2>

      {/* Daily Performance */}
      <section className="analytics-section">
        <h2>Daily Performance</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Tickets Assigned vs Resolved */}
          <div style={{ width: "100%", height: "300px" }}>
            <h3>Daily Workload Comparison</h3>
            <ResponsiveContainer>
              <BarChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalTasks" name="Tickets Assigned" fill="#8884d8" />
                <Bar dataKey="completed" name="Tickets Resolved" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SLA Breaches Trend */}
          <div style={{ width: "100%", height: "300px" }}>
            <h3>SLA Breaches Trend</h3>
            <ResponsiveContainer>
              <LineChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="late" name="SLA Breaches" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Weekly Analysis */}
      <section className="analytics-section" style={{ marginTop: "40px" }}>
        <h2>Weekly Analysis</h2>
        
        {/* Weekly Performance Comparison */}
        <div style={{ width: "100%", height: "400px", marginTop: "20px" }}>
          <h3>Weekly Performance Comparison</h3>
          <ResponsiveContainer>
            <BarChart data={processWeeklyMetrics()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" name="Tickets Assigned" fill="#8884d8" />
              <Bar dataKey="resolved" name="Tickets Resolved" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap and Radar Chart */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
          {/* SLA Breaches Heatmap */}
          <div style={{ width: "48%", height: "400px" }}>
            <h3>SLA Breaches by Day</h3>
            <ResponsiveContainer>
              <BarChart data={processHeatmapData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="day" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="breachRate" name="SLA Breach Rate (%)" fill="#ff7300">
                  {processHeatmapData().map((entry, index) => (
                    <Cell key={"cell-" + index} fill={"rgb(255, " + Math.max(0, 165 - entry.breachRate * 1.65) + ", 0)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Efficiency Radar Chart */}
          <div style={{ width: "48%", height: "400px" }}>
            <h3>Performance Profile</h3>
            <ResponsiveContainer>
              <RadarChart outerRadius={150} data={processRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Performance Metrics" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard-header {
          margin-bottom: 30px;
        }

        .user-info {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .user-info h4 {
          margin: 0;
          color: #333;
        }

        .analytics-section {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background: white;
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        tr:hover {
          background-color: #f5f5f5;
        }

        h1 {
          color: #333;
          margin: 0;
          padding: 20px 0;
          border-bottom: 2px solid #8884d8;
        }

        h2 {
          color: #444;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        h3 {
          color: #666;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}
