import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

export default function ProjectManagerEmailDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [emailAnalytics, setEmailAnalytics] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [feedbackForm, setFeedbackForm] = useState({
    recipientEmail: '',
    recipientName: '',
    feedback: '',
    performanceData: {
      completionRate: '',
      completedTasks: '',
      slaPerformance: '',
      clientInteractions: ''
    }
  });

  const [alertForm, setAlertForm] = useState({
    subject: '',
    message: '',
    priority: 'high',
    recipients: 'all'
  });

  const [reminderForm, setReminderForm] = useState({
    targetDate: new Date().toISOString().split('T')[0],
    missingSubmissions: []
  });

  useEffect(() => {
    checkEmailConnection();
    fetchTeamMembers();
    fetchEmailAnalytics();
  }, []);

  const checkEmailConnection = async () => {
    console.log('🔄 Checking email connection...'); // Debug log
    setConnectionStatus('checking'); // Show checking status
    try {
      const response = await axios.get('/api/pm-email/test-connection');
      console.log('✅ Connection response:', response.data); // Debug log
      setConnectionStatus(response.data.status);
    } catch (error) {
      console.error('❌ Email connection test failed:', error); // Enhanced error log
      setConnectionStatus('disconnected');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/api/pm-email/team-members');
      setTeamMembers(response.data.teamMembers);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const fetchEmailAnalytics = async () => {
    try {
      const response = await axios.get('/api/pm-email/email-analytics');
      setEmailAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch email analytics:', error);
    }
  };

  const sendTeamReport = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await axios.post('/api/pm-email/send-team-report', {
        reportPeriod: 'This Week'
      });
      
      setMessage(`✅ Team report sent successfully to ${response.data.emailsSent} team members`);
      fetchEmailAnalytics(); // Refresh analytics
    } catch (error) {
      setMessage(`❌ Failed to send team report: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendIndividualFeedback = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');

      const response = await axios.post('/api/pm-email/send-individual-feedback', feedbackForm);
      
      setMessage(`✅ Individual feedback sent to ${feedbackForm.recipientEmail}`);
      setFeedbackForm({
        recipientEmail: '',
        recipientName: '',
        feedback: '',
        performanceData: {
          completionRate: '',
          completedTasks: '',
          slaPerformance: '',
          clientInteractions: ''
        }
      });
      fetchEmailAnalytics();
    } catch (error) {
      setMessage(`❌ Failed to send feedback: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendUrgentAlert = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');

      // Increase timeout for alert sending to 30 seconds
      const response = await axios.post('/api/pm-email/send-urgent-alert', alertForm, {
        timeout: 30000 // 30 second timeout for urgent alerts
      });
      
      setMessage(`🚨 Urgent alert sent successfully to ${response.data.results.length} recipients`);
      setAlertForm({
        subject: '',
        message: '',
        priority: 'high',
        recipients: 'all'
      });
      fetchEmailAnalytics();
    } catch (error) {
      setMessage(`❌ Failed to send alert: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMetricsReminder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');

      if (reminderForm.missingSubmissions.length === 0) {
        setMessage('❌ Please select team members to send reminders to');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/pm-email/send-metrics-reminder', reminderForm);
      
      setMessage(`📋 Metrics reminders sent to ${response.data.results.length} team members`);
      setReminderForm({
        targetDate: new Date().toISOString().split('T')[0],
        missingSubmissions: []
      });
      fetchEmailAnalytics();
    } catch (error) {
      setMessage(`❌ Failed to send reminders: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderRecipient = (member) => {
    setReminderForm(prev => ({
      ...prev,
      missingSubmissions: prev.missingSubmissions.find(s => s.email === member.email)
        ? prev.missingSubmissions.filter(s => s.email !== member.email)
        : [...prev.missingSubmissions, { name: member.name, email: member.email }]
    }));
  };

  const renderConnectionStatus = () => (
    <div className={`connection-status ${connectionStatus}`}>
      <div className="status-indicator">
        {connectionStatus === 'connected' && (
          <>
            <span className="status-icon">✅</span>
            <span>Email Service Connected</span>
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <>
            <span className="status-icon">❌</span>
            <span>Email Service Disconnected</span>
          </>
        )}
        {connectionStatus === 'checking' && (
          <>
            <span className="status-icon">🔄</span>
            <span>Checking Connection...</span>
          </>
        )}
      </div>
      <button onClick={checkEmailConnection} className="refresh-btn">
        🔄 Refresh
      </button>
    </div>
  );

  const renderEmailAnalytics = () => (
    <div className="email-analytics">
      <h3>📊 Email Analytics</h3>
      {emailAnalytics ? (
        <div className="analytics-grid">
          <div className="metric-card">
            <h4>Total Sent</h4>
            <span className="metric-value">{emailAnalytics.totalSent}</span>
          </div>
          <div className="metric-card">
            <h4>Recent Messages</h4>
            <span className="metric-value">{emailAnalytics.recentMessages.length}</span>
          </div>
          
          <div className="analytics-breakdown">
            <h4>Email Types (Recent)</h4>
            <div className="breakdown-grid">
              <div>🚨 Alerts: {emailAnalytics.analytics.alerts}</div>
              <div>📊 Reports: {emailAnalytics.analytics.reports}</div>
              <div>💬 Feedback: {emailAnalytics.analytics.feedback}</div>
              <div>📋 Reminders: {emailAnalytics.analytics.reminders}</div>
              <div>📄 Other: {emailAnalytics.analytics.other}</div>
            </div>
          </div>

          <div className="recent-messages">
            <h4>Recent Email Activity</h4>
            {emailAnalytics.recentMessages.slice(0, 5).map((msg, index) => (
              <div key={index} className="message-item">
                <strong>{msg.subject}</strong>
                <p>To: {msg.to}</p>
                <small>{new Date(msg.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="loading">Loading analytics...</div>
      )}
    </div>
  );

  return (
    <div className="pm-email-dashboard">
      <div className="dashboard-header">
        <h2>📧 Project Manager Email Dashboard</h2>
        {renderConnectionStatus()}
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="email-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          📈 Team Reports
        </button>
        <button 
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          💬 Individual Feedback
        </button>
        <button 
          className={activeTab === 'alerts' ? 'active' : ''}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Urgent Alerts
        </button>
        <button 
          className={activeTab === 'reminders' ? 'active' : ''}
          onClick={() => setActiveTab('reminders')}
        >
          📋 Reminders
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="team-summary">
                <h3>👥 Team Summary</h3>
                <p>Total Team Members: {teamMembers.length}</p>
                <div className="team-list">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="team-member-item">
                      <span className="member-name">{member.name}</span>
                      <span className="member-email">{member.email}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {renderEmailAnalytics()}
              
              <div className="quick-actions">
                <h3>⚡ Quick Actions</h3>
                <button 
                  onClick={sendTeamReport} 
                  disabled={loading || connectionStatus !== 'connected'}
                  className="action-btn primary"
                >
                  📊 Send Weekly Team Report
                </button>
                <button 
                  onClick={() => setActiveTab('alerts')}
                  className="action-btn warning"
                >
                  🚨 Send Urgent Alert
                </button>
                <button 
                  onClick={() => setActiveTab('reminders')}
                  className="action-btn info"
                >
                  📋 Send Metrics Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h3>📈 Team Performance Reports</h3>
            <div className="report-options">
              <div className="report-card">
                <h4>📊 Weekly Team Report</h4>
                <p>Send comprehensive performance report to all team members including individual and aggregate metrics.</p>
                <button 
                  onClick={sendTeamReport}
                  disabled={loading || connectionStatus !== 'connected'}
                  className="send-btn"
                >
                  {loading ? '📤 Sending...' : '📤 Send Team Report'}
                </button>
              </div>
              
              <div className="report-info">
                <h4>📋 Report Contents</h4>
                <ul>
                  <li>Overall team performance metrics</li>
                  <li>Individual performance breakdown</li>
                  <li>Completion rates and SLA performance</li>
                  <li>Action items and recommendations</li>
                  <li>Visual performance indicators</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-section">
            <h3>💬 Send Individual Feedback</h3>
            <form onSubmit={sendIndividualFeedback} className="feedback-form">
              <div className="form-group">
                <label>Team Member:</label>
                <select
                  value={feedbackForm.recipientEmail}
                  onChange={(e) => {
                    const selectedMember = teamMembers.find(m => m.email === e.target.value);
                    setFeedbackForm(prev => ({
                      ...prev,
                      recipientEmail: e.target.value,
                      recipientName: selectedMember ? selectedMember.name : ''
                    }));
                  }}
                  required
                >
                  <option value="">Select team member...</option>
                  {teamMembers.map((member, index) => (
                    <option key={index} value={member.email}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="performance-data">
                <h4>📊 Performance Data (Optional)</h4>
                <div className="data-grid">
                  <div className="form-group">
                    <label>Completion Rate (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={feedbackForm.performanceData.completionRate}
                      onChange={(e) => setFeedbackForm(prev => ({
                        ...prev,
                        performanceData: {
                          ...prev.performanceData,
                          completionRate: e.target.value
                        }
                      }))}
                      placeholder="85"
                    />
                  </div>
                  <div className="form-group">
                    <label>Completed Tasks:</label>
                    <input
                      type="number"
                      min="0"
                      value={feedbackForm.performanceData.completedTasks}
                      onChange={(e) => setFeedbackForm(prev => ({
                        ...prev,
                        performanceData: {
                          ...prev.performanceData,
                          completedTasks: e.target.value
                        }
                      }))}
                      placeholder="25"
                    />
                  </div>
                  <div className="form-group">
                    <label>SLA Performance (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={feedbackForm.performanceData.slaPerformance}
                      onChange={(e) => setFeedbackForm(prev => ({
                        ...prev,
                        performanceData: {
                          ...prev.performanceData,
                          slaPerformance: e.target.value
                        }
                      }))}
                      placeholder="92"
                    />
                  </div>
                  <div className="form-group">
                    <label>Client Interactions:</label>
                    <input
                      type="number"
                      min="0"
                      value={feedbackForm.performanceData.clientInteractions}
                      onChange={(e) => setFeedbackForm(prev => ({
                        ...prev,
                        performanceData: {
                          ...prev.performanceData,
                          clientInteractions: e.target.value
                        }
                      }))}
                      placeholder="15"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Feedback Message:</label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    feedback: e.target.value
                  }))}
                  required
                  rows="6"
                  placeholder="Provide detailed feedback on performance, achievements, and areas for improvement..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || connectionStatus !== 'connected'}
                className="send-btn"
              >
                {loading ? '💬 Sending...' : '💬 Send Feedback'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <h3>🚨 Send Urgent Alert</h3>
            <form onSubmit={sendUrgentAlert} className="alert-form">
              <div className="form-group">
                <label>Priority Level:</label>
                <select
                  value={alertForm.priority}
                  onChange={(e) => setAlertForm(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="normal">🟢 Normal Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label>Recipients:</label>
                <select
                  value={alertForm.recipients}
                  onChange={(e) => setAlertForm(prev => ({
                    ...prev,
                    recipients: e.target.value
                  }))}
                >
                  <option value="all">All Team Members</option>
                  {teamMembers.map((member, index) => (
                    <option key={index} value={member.email}>
                      {member.name} only
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={alertForm.subject}
                  onChange={(e) => setAlertForm(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  required
                  placeholder="Urgent: System maintenance scheduled"
                />
              </div>

              <div className="form-group">
                <label>Alert Message:</label>
                <textarea
                  value={alertForm.message}
                  onChange={(e) => setAlertForm(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  required
                  rows="6"
                  placeholder="Provide clear, actionable information about the urgent situation..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || connectionStatus !== 'connected'}
                className="send-btn alert-btn"
              >
                {loading ? '🚨 Sending...' : '🚨 Send Urgent Alert'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="reminders-section">
            <h3>📋 Send Metrics Submission Reminders</h3>
            <form onSubmit={sendMetricsReminder} className="reminder-form">
              <div className="form-group">
                <label>Target Date:</label>
                <input
                  type="date"
                  value={reminderForm.targetDate}
                  onChange={(e) => setReminderForm(prev => ({
                    ...prev,
                    targetDate: e.target.value
                  }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Team Members to Remind:</label>
                <div className="member-selection">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="member-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={reminderForm.missingSubmissions.some(s => s.email === member.email)}
                          onChange={() => toggleReminderRecipient(member)}
                        />
                        <span className="member-info">
                          <span className="name">{member.name}</span>
                          <span className="email">{member.email}</span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="selected-summary">
                <p>Selected: {reminderForm.missingSubmissions.length} team member(s)</p>
              </div>

              <button 
                type="submit" 
                disabled={loading || connectionStatus !== 'connected' || reminderForm.missingSubmissions.length === 0}
                className="send-btn"
              >
                {loading ? '📋 Sending...' : `📋 Send Reminders (${reminderForm.missingSubmissions.length})`}
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .pm-email-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
        }

        .connection-status.connected {
          background: #e8f5e8;
          color: #2e7d32;
          border: 1px solid #4caf50;
        }

        .connection-status.disconnected {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #f44336;
        }

        .connection-status.checking {
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #2196f3;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .refresh-btn {
          background: none;
          border: 1px solid currentColor;
          color: inherit;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .message {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background: #e8f5e8;
          color: #2e7d32;
          border: 1px solid #4caf50;
        }

        .message.error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #f44336;
        }

        .email-tabs {
          display: flex;
          gap: 5px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .email-tabs button {
          padding: 12px 20px;
          border: none;
          background: #f5f5f5;
          color: #666;
          cursor: pointer;
          border-radius: 6px 6px 0 0;
          font-weight: 500;
          transition: all 0.2s;
        }

        .email-tabs button.active {
          background: #2196f3;
          color: white;
        }

        .email-tabs button:hover:not(.active) {
          background: #e0e0e0;
        }

        .tab-content {
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .team-summary, .email-analytics, .quick-actions {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .team-member-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          margin: 5px 0;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .member-name {
          font-weight: 500;
          color: #333;
        }

        .member-email {
          color: #666;
          font-size: 14px;
        }

        .analytics-grid {
          display: grid;
          gap: 15px;
        }

        .metric-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }

        .metric-value {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #2196f3;
          margin-top: 5px;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .breakdown-grid > div {
          background: white;
          padding: 8px;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
        }

        .message-item {
          background: white;
          padding: 10px;
          margin: 5px 0;
          border-radius: 4px;
          border-left: 3px solid #2196f3;
        }

        .message-item strong {
          display: block;
          color: #333;
          margin-bottom: 5px;
        }

        .message-item p {
          margin: 3px 0;
          color: #666;
          font-size: 14px;
        }

        .message-item small {
          color: #999;
          font-size: 12px;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #2196f3;
          color: white;
        }

        .action-btn.warning {
          background: #ff9800;
          color: white;
        }

        .action-btn.info {
          background: #00bcd4;
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .member-selection {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 10px;
        }

        .member-checkbox {
          margin-bottom: 10px;
        }

        .member-checkbox label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .member-checkbox label:hover {
          background: #f5f5f5;
        }

        .member-info {
          display: flex;
          flex-direction: column;
        }

        .member-info .name {
          font-weight: 500;
          color: #333;
        }

        .member-info .email {
          font-size: 12px;
          color: #666;
        }

        .send-btn {
          background: #4caf50;
          color: white;
          padding: 14px 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 16px;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #45a049;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .send-btn.alert-btn {
          background: #f44336;
        }

        .send-btn.alert-btn:hover:not(:disabled) {
          background: #da190b;
        }

        .selected-summary {
          background: #e3f2fd;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          text-align: center;
          font-weight: 500;
          color: #1976d2;
        }

        .report-options {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 25px;
        }

        .report-card {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .report-card h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .report-info {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #4caf50;
        }

        .report-info h4 {
          margin: 0 0 15px 0;
          color: #2e7d32;
        }

        .report-info ul {
          margin: 0;
          padding-left: 20px;
          color: #333;
        }

        .report-info li {
          margin-bottom: 8px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          
          .report-options {
            grid-template-columns: 1fr;
          }
          
          .data-grid {
            grid-template-columns: 1fr;
          }
          
          .email-tabs {
            flex-wrap: wrap;
          }
          
          .email-tabs button {
            font-size: 14px;
            padding: 10px 15px;
          }
        }
      `}</style>
    </div>
  );
}