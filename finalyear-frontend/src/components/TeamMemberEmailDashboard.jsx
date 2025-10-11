import { useState, useEffect } from 'react';
import axios from '../config/axios';

export default function TeamMemberEmailDashboard() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [notifications, setNotifications] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [supportRequest, setSupportRequest] = useState({
    subject: '',
    description: '',
    urgency: 'low'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    checkEmailConnection();
    fetchNotifications();
  }, []);

  const checkEmailConnection = async () => {
    try {
      const response = await axios.get('/api/tm-email/test-connection');
      if (response.data.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/tm-email/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const sendStatusUpdate = async () => {
    if (!statusUpdate.subject || !statusUpdate.message) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/tm-email/send-status-update', statusUpdate);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Status update sent successfully!' });
        setStatusUpdate({ subject: '', message: '', priority: 'normal' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to send status update' });
      }
    } catch (error) {
      console.error('Status update failed:', error);
      setMessage({ type: 'error', text: 'Failed to send status update' });
    } finally {
      setLoading(false);
    }
  };

  const sendSupportRequest = async () => {
    if (!supportRequest.subject || !supportRequest.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/tm-email/send-support-request', supportRequest);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Support request sent successfully!' });
        setSupportRequest({ subject: '', description: '', urgency: 'low' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to send support request' });
      }
    } catch (error) {
      console.error('Support request failed:', error);
      setMessage({ type: 'error', text: 'Failed to send support request' });
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionStatus = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '20px',
      padding: '10px',
      backgroundColor: connectionStatus === 'connected' ? '#f0f9ff' : '#fef2f2',
      border: `1px solid ${connectionStatus === 'connected' ? '#3b82f6' : '#ef4444'}`,
      borderRadius: '8px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#ef4444'
      }} />
      <span style={{
        color: connectionStatus === 'connected' ? '#059669' : '#dc2626',
        fontWeight: '500'
      }}>
        Email Service: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
      </span>
      <button
        onClick={checkEmailConnection}
        style={{
          marginLeft: 'auto',
          padding: '4px 8px',
          fontSize: '12px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Refresh
      </button>
    </div>
  );

  const renderMessage = () => {
    if (!message.text) return null;
    return (
      <div style={{
        padding: '10px',
        marginBottom: '20px',
        backgroundColor: message.type === 'success' ? '#f0f9ff' : '#fef2f2',
        color: message.type === 'success' ? '#059669' : '#dc2626',
        border: `1px solid ${message.type === 'success' ? '#3b82f6' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        {message.text}
      </div>
    );
  };

  const renderNotifications = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#374151' }}>Recent Notifications</h3>
      
      {notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p>No notifications available</p>
          <button
            onClick={fetchNotifications}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh Notifications
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notifications.map((notification, index) => (
            <div key={index} style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#374151' }}>{notification.subject}</h4>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {new Date(notification.date).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.5' }}>{notification.message}</p>
              {notification.priority === 'high' && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '12px',
                  border: '1px solid #fecaca'
                }}>
                  High Priority
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatusUpdate = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#374151' }}>Send Status Update</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Subject *
          </label>
          <input
            type="text"
            value={statusUpdate.subject}
            onChange={(e) => setStatusUpdate(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Weekly Status Update - [Your Name]"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Priority
          </label>
          <select
            value={statusUpdate.priority}
            onChange={(e) => setStatusUpdate(prev => ({ ...prev, priority: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Status Message *
          </label>
          <textarea
            value={statusUpdate.message}
            onChange={(e) => setStatusUpdate(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Describe your current progress, completed tasks, and any blockers..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={sendStatusUpdate}
          disabled={loading || !statusUpdate.subject || !statusUpdate.message}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Sending...' : 'Send Status Update'}
        </button>
      </div>
    </div>
  );

  const renderSupportRequest = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#374151' }}>Request Support</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Subject *
          </label>
          <input
            type="text"
            value={supportRequest.subject}
            onChange={(e) => setSupportRequest(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Brief description of the issue"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Urgency Level
          </label>
          <select
            value={supportRequest.urgency}
            onChange={(e) => setSupportRequest(prev => ({ ...prev, urgency: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="low">Low - Can wait</option>
            <option value="medium">Medium - Need help soon</option>
            <option value="high">High - Blocking my work</option>
            <option value="critical">Critical - Urgent assistance needed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
            Problem Description *
          </label>
          <textarea
            value={supportRequest.description}
            onChange={(e) => setSupportRequest(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the issue in detail, including steps you've already tried..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={sendSupportRequest}
          disabled={loading || !supportRequest.subject || !supportRequest.description}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#9ca3af' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Sending...' : 'Send Support Request'}
        </button>
      </div>
    </div>
  );

  const renderTeamInfo = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#374151' }}>Team Information</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Quick Tips</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', lineHeight: '1.6' }}>
            <li>Send status updates regularly to keep your team lead informed</li>
            <li>Use support requests for technical issues or blockers</li>
            <li>Check notifications daily for important team updates</li>
            <li>Mark urgent issues appropriately in support requests</li>
          </ul>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Contact Information</h4>
          <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>
            <strong>Team Lead:</strong> {localStorage.getItem('teamLead') || 'Not assigned'}
          </p>
          <p style={{ margin: 0, color: '#6b7280' }}>
            <strong>Project Manager:</strong> {localStorage.getItem('projectManager') || 'Not assigned'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {renderConnectionStatus()}
      {renderMessage()}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '24px',
        backgroundColor: 'white',
        borderRadius: '8px 8px 0 0'
      }}>
        {[
          { id: 'notifications', label: 'Notifications', icon: '🔔' },
          { id: 'status', label: 'Status Update', icon: '📝' },
          { id: 'support', label: 'Support Request', icon: '🆘' },
          { id: 'info', label: 'Team Info', icon: 'ℹ️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              cursor: 'pointer',
              borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0',
              fontWeight: activeTab === tab.id ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'status' && renderStatusUpdate()}
        {activeTab === 'support' && renderSupportRequest()}
        {activeTab === 'info' && renderTeamInfo()}
      </div>
    </div>
  );
}