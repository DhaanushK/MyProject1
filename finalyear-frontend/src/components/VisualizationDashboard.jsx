import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import axios from '../config/axios';

export default function VisualizationDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        console.log('Fetching visualization metrics...');
        
        const response = await axios.get('/api/metrics/user', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Visualization metrics response:', response.data);
        
        // Validate and transform the data
        let metricsData = [];
        if (response.data && response.data.metrics) {
          metricsData = response.data.metrics.map(metric => ({
            ...metric,
            date: new Date(metric.date).toLocaleDateString(),
            totalTasks: Number(metric.totalTasks) || 0,
            completed: Number(metric.completed) || 0,
            pending: Number(metric.pending) || 0,
            late: Number(metric.late) || 0,
            interactions: Number(metric.interactions) || 0
          }));
        }

        if (metricsData.length === 0) {
          console.warn('No visualization metrics received');
          setError('No metrics data available');
        } else {
          console.log('Processed metrics data:', metricsData);
          setMetrics(metricsData);
          setUserName(response.data.userName || username || '');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching visualization metrics:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserMetrics();
  }, []);

  // Process weekly metrics
  const processWeeklyMetrics = () => {
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    const weeklyData = {};
    
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const date = new Date(metric.date);
      const weekNumber = Math.ceil((date.getDate()) / 7);
      const weekKey = `Week ${weekNumber}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          assigned: 0,
          resolved: 0,
          slaBreaches: 0,
          interactions: 0,
          responsiveness: 0
        };
      }

      weeklyData[weekKey].assigned += metric.totalTasks;
      weeklyData[weekKey].resolved += metric.completed;
      weeklyData[weekKey].slaBreaches += metric.late;
      weeklyData[weekKey].interactions += metric.interactions;
      weeklyData[weekKey].responsiveness = (metric.completed / metric.totalTasks) * 100 || 0;
    }

    const result = [];
    for (const key in weeklyData) {
      result.push(weeklyData[key]);
    }
    return result;
  };

  // Process daily heatmap data
  const processHeatmapData = () => {
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmapData = {};
    
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const date = new Date(metric.date);
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      if (!heatmapData[dayOfWeek]) {
        heatmapData[dayOfWeek] = {
          day: dayOfWeek,
          slaBreaches: 0,
          totalTasks: 0
        };
      }

      heatmapData[dayOfWeek].slaBreaches += metric.late;
      heatmapData[dayOfWeek].totalTasks += metric.totalTasks;
      heatmapData[dayOfWeek].breachRate = (heatmapData[dayOfWeek].slaBreaches / heatmapData[dayOfWeek].totalTasks) * 100;
    }

    const result = [];
    for (const key in heatmapData) {
      result.push(heatmapData[key]);
    }
    return result;
  };

  // Process radar chart data
  const processRadarData = () => {
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    const totalMetrics = { totalAssigned: 0, totalResolved: 0, totalSLABreaches: 0, totalInteractions: 0 };
    
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      totalMetrics.totalAssigned += metric.totalTasks;
      totalMetrics.totalResolved += metric.completed;
      totalMetrics.totalSLABreaches += metric.late;
      totalMetrics.totalInteractions += metric.interactions;
    }

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: "#f5f5f5"
      }}>
        <div>Loading visualizations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: "#f5f5f5"
      }}>
        <div style={{ color: 'red' }}>Error: {error}</div>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: "#f5f5f5"
      }}>
        <div>No metrics data available for visualization</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div className="dashboard-header">
        <h1>Performance Analysis</h1>
        <p style={{ color: '#666' }}>Showing metrics for {userName}</p>
      </div>

      {/* Daily Performance */}
      <section className="analytics-section">
        <h2>Daily Performance</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Tickets Assigned vs Resolved */}
          <div style={{ width: "100%", height: "300px" }}>
            <h3>Daily Workload Comparison</h3>
            {metrics.length > 0 ? (
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
            ) : (
              <div style={{ 
                height: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px"
              }}>
                <p>No data available for visualization</p>
              </div>
            )}
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

        .analytics-section {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
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