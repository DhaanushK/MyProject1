import { useState, useEffect } from 'react';
import axios from '../config/axios';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const logsPerPage = 15;

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/logs/activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(response.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching activity logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/logs/activity/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const downloadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/logs/activity/download', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error downloading logs');
      console.error('Error downloading logs:', err);
    }
  };

  const refreshLogs = () => {
    setLoading(true);
    setError('');
    fetchLogs();
    fetchStats();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '16px'
      }}>
        🔄 Loading activity logs...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #f5c6cb',
        textAlign: 'center'
      }}>
        ❌ Error: {error}
        <button 
          onClick={refreshLogs}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h3 style={{ margin: 0 }}>📋 Activity Logs</h3>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          
          <button
            onClick={refreshLogs}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
          
          <button
            onClick={downloadLogs}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📥 Download Excel
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && stats && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 15px 0' }}>📈 Activity Statistics</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            <div>
              <strong>Total Logs:</strong> {stats.totalLogs}
            </div>
            <div>
              <strong>Submissions:</strong> {stats.submissionCount}
            </div>
            <div>
              <strong>Updates:</strong> {stats.updateCount}
            </div>
            <div>
              <strong>Active Users:</strong> {stats.uniqueUsers}
            </div>
            <div>
              <strong>Recent Activity (7 days):</strong> {stats.recentActivity}
            </div>
            <div>
              <strong>Role Distribution:</strong>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                {Object.entries(stats.roleStats).map(([role, count]) => (
                  <div key={role}>• {role}: {count}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          📝 No activity logs found. Start submitting metrics to see logs here.
        </div>
      ) : (
        <>
          {/* Logs Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ 
                    padding: '12px 8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'left',
                    fontWeight: '600'
                  }}>
                    Date & Time
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'left',
                    fontWeight: '600'
                  }}>
                    Name
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'left',
                    fontWeight: '600'
                  }}>
                    Role
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'left',
                    fontWeight: '600'
                  }}>
                    Event
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                    transition: 'background-color 0.2s'
                  }}>
                    <td style={{ 
                      padding: '10px 8px', 
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.Date}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {log.Name}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      border: '1px solid #ddd'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 
                          log.Role === 'project_manager' ? '#dc3545' : 
                          log.Role === 'team_lead' ? '#ffc107' : '#007bff',
                        color: log.Role === 'team_lead' ? '#000' : 'white'
                      }}>
                        {log.Role === 'project_manager' ? 'PM' : 
                         log.Role === 'team_lead' ? 'Lead' : 'Member'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      border: '1px solid #ddd', 
                      fontSize: '13px',
                      lineHeight: '1.4'
                    }}>
                      {log.Event}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginTop: '20px', 
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === 1 ? '#f8f9fa' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Previous
              </button>

              <span style={{ 
                padding: '8px 12px', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Summary */}
          <div style={{ 
            marginTop: '15px', 
            fontSize: '14px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, logs.length)} of {logs.length} entries
          </div>
        </>
      )}
    </div>
  );
}