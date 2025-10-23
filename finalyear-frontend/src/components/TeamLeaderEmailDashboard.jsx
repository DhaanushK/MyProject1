import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import GmailAuth from './GmailAuth';
import TeamLeaderMailbox from './TeamLeaderMailbox';

export default function TeamLeaderEmailDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [teamUpdateForm, setTeamUpdateForm] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });

  const [reminderForm, setReminderForm] = useState({
    targetDate: new Date().toISOString().split('T')[0],
    selectedMembers: []
  });

  const [alertForm, setAlertForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  useEffect(() => {
    checkEmailConnection();
    fetchTeamMembers();
  }, []);

  const checkEmailConnection = async () => {
    try {
      const response = await axios.get('/api/tl-email/test-connection');
      setConnectionStatus(response.data.status);
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Email connection test failed:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/api/tl-email/team-members');
      setTeamMembers(response.data.teamMembers || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const sendTeamUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      
      const response = await axios.post('/api/tl-email/send-team-update', teamUpdateForm);
      
      setMessage(`✅ Team update sent successfully to ${response.data.emailsSent} team members`);
      setTeamUpdateForm({
        subject: '',
        message: '',
        priority: 'normal'
      });
    } catch (error) {
      setMessage(`❌ Failed to send team update: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMetricsReminder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');

      if (reminderForm.selectedMembers.length === 0) {
        setMessage('❌ Please select team members to send reminders to');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/tl-email/send-metrics-reminder', {
        targetDate: reminderForm.targetDate,
        selectedMembers: reminderForm.selectedMembers
      });
      
      setMessage(`📋 Metrics reminders sent to ${response.data.results.length} team members`);
      setReminderForm({
        targetDate: new Date().toISOString().split('T')[0],
        selectedMembers: []
      });
    } catch (error) {
      setMessage(`❌ Failed to send reminders: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTeamAlert = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');

      const response = await axios.post('/api/tl-email/send-team-alert', alertForm);
      
      setMessage(`🚨 Alert sent successfully to ${response.data.results.length} team members`);
      setAlertForm({
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      setMessage(`❌ Failed to send alert: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (member) => {
    setReminderForm(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.find(m => m.email === member.email)
        ? prev.selectedMembers.filter(m => m.email !== member.email)
        : [...prev.selectedMembers, { name: member.name, email: member.email }]
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

  return (
    <div className="tl-email-dashboard">
      <div className="dashboard-header">
        <h2>📧 Team Leader Email Dashboard</h2>
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
          className={activeTab === 'mailbox' ? 'active' : ''}
          onClick={() => setActiveTab('mailbox')}
        >
          📬 Mailbox
        </button>
        <button 
          className={activeTab === 'updates' ? 'active' : ''}
          onClick={() => setActiveTab('updates')}
        >
          📢 Team Updates
        </button>
        <button 
          className={activeTab === 'reminders' ? 'active' : ''}
          onClick={() => setActiveTab('reminders')}
        >
          📋 Reminders
        </button>
        <button 
          className={activeTab === 'alerts' ? 'active' : ''}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'mailbox' && (
          <>
            <GmailAuth />
            <TeamLeaderMailbox />
          </>
        )}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="team-summary">
                <h3>👥 My Team</h3>
                <p>Total Team Members: {teamMembers.length}</p>
                <div className="team-list">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="team-member-item">
                      <span className="member-name">{member.name}</span>
                      <span className="member-email">{member.email}</span>
                      <span className="member-role">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="quick-actions">
                <h3>⚡ Quick Actions</h3>
                <button 
                  onClick={() => setActiveTab('updates')}
                  className="action-btn primary"
                  disabled={connectionStatus !== 'connected'}
                >
                  📢 Send Team Update
                </button>
                <button 
                  onClick={() => setActiveTab('reminders')}
                  className="action-btn info"
                  disabled={connectionStatus !== 'connected'}
                >
                  📋 Send Metrics Reminder
                </button>
                <button 
                  onClick={() => setActiveTab('alerts')}
                  className="action-btn warning"
                  disabled={connectionStatus !== 'connected'}
                >
                  🚨 Send Team Alert
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="updates-section">
            <h3>📢 Send Team Update</h3>
            <form onSubmit={sendTeamUpdate} className="update-form">
              <div className="form-group">
                <label>Priority Level:</label>
                <select
                  value={teamUpdateForm.priority}
                  onChange={(e) => setTeamUpdateForm(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <option value="normal">📝 Normal</option>
                  <option value="medium">📋 Important</option>
                  <option value="high">⚠️ High Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={teamUpdateForm.subject}
                  onChange={(e) => setTeamUpdateForm(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  required
                  placeholder="Team Meeting Tomorrow at 2 PM"
                />
              </div>

              <div className="form-group">
                <label>Update Message:</label>
                <textarea
                  value={teamUpdateForm.message}
                  onChange={(e) => setTeamUpdateForm(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  required
                  rows="6"
                  placeholder="Hi team, I wanted to update you on our progress and upcoming deadlines..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || connectionStatus !== 'connected'}
                className="send-btn"
              >
                {loading ? '📢 Sending...' : '📢 Send Team Update'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="reminders-section">
            <h3>📋 Send Metrics Reminders</h3>
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
                <label>Select Team Members:</label>
                <div className="member-selection">
                  {teamMembers.filter(member => member.role === 'team_member').map((member, index) => (
                    <div key={index} className="member-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={reminderForm.selectedMembers.some(m => m.email === member.email)}
                          onChange={() => toggleMemberSelection(member)}
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
                <p>Selected: {reminderForm.selectedMembers.length} team member(s)</p>
              </div>

              <button 
                type="submit" 
                disabled={loading || connectionStatus !== 'connected' || reminderForm.selectedMembers.length === 0}
                className="send-btn"
              >
                {loading ? '📋 Sending...' : `📋 Send Reminders (${reminderForm.selectedMembers.length})`}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <h3>🚨 Send Team Alert</h3>
            <form onSubmit={sendTeamAlert} className="alert-form">
              <div className="form-group">
                <label>Priority Level:</label>
                <select
                  value={alertForm.priority}
                  onChange={(e) => setAlertForm(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <option value="normal">🟢 Normal</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
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
                  placeholder="Urgent: Server maintenance tonight"
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
                  placeholder="Team, please be aware that there will be server maintenance tonight from 10 PM to 2 AM..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || connectionStatus !== 'connected'}
                className="send-btn alert-btn"
              >
                {loading ? '🚨 Sending...' : '🚨 Send Team Alert'}
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .tl-email-dashboard {
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
          grid-template-columns: 1fr 300px;
          gap: 25px;
        }

        .team-summary, .quick-actions {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .team-member-item {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 10px;
          padding: 8px 12px;
          margin: 5px 0;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
          font-size: 14px;
        }

        .member-name {
          font-weight: 500;
          color: #333;
        }

        .member-email {
          color: #666;
        }

        .member-role {
          color: #007bff;
          font-size: 12px;
          text-transform: uppercase;
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

        .action-btn:hover:not(:disabled) {
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

        @media (max-width: 768px) {
          .overview-grid {
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