import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from "recharts";
import { useState, useEffect } from "react";
import axios from "../config/axios";

export default function PerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsData, setMetricsData] = useState(null);

  useEffect(() => {
    fetchTeamMetrics();
  }, []);

  const fetchTeamMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/metrics/all');
      setMetricsData(response.data);
    } catch (err) {
      console.error('Error fetching team metrics:', err);
      setError('Failed to load team metrics');
    } finally {
      setLoading(false);
    }
  };

  // Data processing functions
  const processTaskCompletion = (aggregatedKPIs) => {
    if (!aggregatedKPIs) return [
      { name: "Completed", value: 80 },
      { name: "Pending", value: 20 }
    ];

    const completed = aggregatedKPIs.completedTasks;
    const pending = aggregatedKPIs.pendingTasks;
    const total = completed + pending;
    
    return [
      { name: "Completed", value: total > 0 ? Math.round((completed / total) * 100) : 0 },
      { name: "Pending", value: total > 0 ? Math.round((pending / total) * 100) : 0 }
    ];
  };

  const processMemberPerformance = (individualKPIs) => {
    if (!individualKPIs) return [
      { name: "Allwin", tasks: 30 },
      { name: "Kalyan", tasks: 25 },
      { name: "Sam", tasks: 18 },
      { name: "Kiran", tasks: 22 }
    ];

    return Object.keys(individualKPIs).map(userName => ({
      name: userName,
      tasks: individualKPIs[userName].completedTasks
    }));
  };

  const processWeeklyProductivity = (userMetrics) => {
    if (!userMetrics) return [
      { week: "Week 1", tasks: 12 },
      { week: "Week 2", tasks: 18 },
      { week: "Week 3", tasks: 15 },
      { week: "Week 4", tasks: 20 }
    ];

    // Group by weeks (simplified - last 4 weeks)
    const weeks = {};
    const allMetrics = Object.values(userMetrics).flat();
    
    // Sort by date and group into weeks
    allMetrics.forEach(metric => {
      if (metric.date) {
        const date = new Date(metric.date);
        const weekNumber = Math.floor((Date.now() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const weekKey = `Week ${Math.min(weekNumber, 4)}`;
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = 0;
        }
        weeks[weekKey] += metric.completed;
      }
    });

    // Convert to array format for chart
    return Object.keys(weeks).map(week => ({
      week,
      tasks: weeks[week]
    })).slice(0, 4);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>📊 Team Performance Dashboard</h2>
        <p>Loading team metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>📊 Team Performance Dashboard</h2>
        <div style={{ color: "red", padding: "20px", background: "#ffebee", borderRadius: "5px" }}>
          <p>Error: {error}</p>
          <button onClick={fetchTeamMetrics} style={{ marginTop: "10px", padding: "5px 10px" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Process data for charts
  const taskCompletion = processTaskCompletion(metricsData?.aggregatedKPIs);
  const memberPerformance = processMemberPerformance(metricsData?.individualKPIs);
  const productivity = processWeeklyProductivity(metricsData?.userMetrics);

  const COLORS = ["#00C49F", "#FF8042"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Team Performance Dashboard</h2>

      {/* KPI Tiles */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        marginBottom: "20px"
      }}>
        <div style={{ background: "#e0f7fa", padding: "15px", borderRadius: "10px" }}>
          <h3>Total Tasks</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>
            {metricsData?.aggregatedKPIs?.totalTasks || 0}
          </p>
        </div>
        <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "10px" }}>
          <h3>Completion Rate</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>
            {metricsData?.aggregatedKPIs?.completionRate || 0}%
          </p>
        </div>
        <div style={{ background: "#fff3e0", padding: "15px", borderRadius: "10px" }}>
          <h3>Late Tasks</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>
            {metricsData?.aggregatedKPIs?.lateTasks || 0}
          </p>
        </div>
        <div style={{ background: "#f3e5f5", padding: "15px", borderRadius: "10px" }}>
          <h3>Client Interactions</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>
            {metricsData?.aggregatedKPIs?.totalClientInteractions || 0}
          </p>
        </div>
      </div>

      {/* Row with charts */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Pie Chart */}
        <div>
          <h3>Task Completion</h3>
          <PieChart width={350} height={300}>
            <Pie
              data={taskCompletion}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {taskCompletion.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        {/* Bar Chart */}
        <div>
          <h3>Member Performance</h3>
          <BarChart
            width={400}
            height={300}
            data={memberPerformance}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tasks" fill="#82ca9d" />
          </BarChart>
        </div>
      </div>

      {/* Line Chart */}
      <div>
        <h3>Weekly Productivity</h3>
        <LineChart
          width={800}
          height={300}
          data={productivity}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="tasks" stroke="#8884d8" />
        </LineChart>
      </div>
    </div>
  );
}
