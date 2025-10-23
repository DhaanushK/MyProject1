import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

export default function TeamLeaderMailbox() {
  // State management
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    unread: 0,
    totalInbox: 0,
    totalOutbox: 0,
    failed: 0,
    messageTypes: {}
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    senderRole: '',
    startDate: '',
    endDate: ''
  });
  const [composing, setComposing] = useState(false);
  const [composeForm, setComposeForm] = useState({
    receiverEmail: '',
    receiverName: '',
    receiverRole: '',
    subject: '',
    message: '',
    attachments: []
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load initial data
  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [activeFolder, pagination.page, filters]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const endpoint = activeFolder === 'outbox' ? '/api/tl-email/outbox' : '/api/tl-email/inbox';
      
      const params = {
        page: pagination.page,
        limit: 20,
        ...filters
      };

      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        setEmails(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch emails');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to fetch emails'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/tl-email/stats');
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch mailbox stats:', error);
      setMessage({
        type: 'error',
        text: error.message
      });
    }
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      
      // Structure the email data to match backend
      const emailData = {
        recipient: {
          email: composeForm.receiverEmail,
          name: composeForm.receiverName,
          role: composeForm.receiverRole
        },
        subject: composeForm.subject,
        content: {
          text: composeForm.message,
          html: composeForm.message.replace(/\n/g, '<br>')
        },
        priority: 'normal'
      };

      // Append the structured data
      formData.append('emailData', JSON.stringify(emailData));

      // Append attachments
      composeForm.attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await axios.post('/api/tl-email/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({
        type: 'success',
        text: 'Email sent successfully'
      });
      setComposing(false);
      setComposeForm({
        receiverEmail: '',
        receiverName: '',
        receiverRole: '',
        subject: '',
        message: '',
        attachments: []
      });
      fetchEmails();
      fetchStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send email'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email) => {
    setSelectedEmail(email);
    if (email.status === 'sent' && activeFolder === 'inbox') {
      try {
        await axios.patch(`/api/tl-email/${email._id}/read`);
        fetchStats();
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  };

  const handleMove = async (emailId, targetFolder) => {
    try {
      await axios.patch(`/api/tl-email/${emailId}/move`, {
        folder: targetFolder
      });
      setMessage({
        type: 'success',
        text: 'Email moved successfully'
      });
      fetchEmails();
      fetchStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to move email'
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      search: e.target.search.value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="mailbox">
      {/* Header */}
      <div className="mailbox-header">
        <h2>📬 Team Lead Mailbox</h2>
        <div className="header-actions">
          <button onClick={() => setComposing(true)} className="compose-btn">
            ✉️ Compose New Message
          </button>
          <button onClick={fetchEmails} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Message bar */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="close-message">
            ×
          </button>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          name="search"
          placeholder="Search emails..."
          defaultValue={filters.search}
        />
        <button type="submit">🔍 Search</button>
      </form>

      {/* Main content */}
      <div className="mailbox-content">
        {/* Left sidebar */}
        <div className="mailbox-sidebar">
          <div className="folder-list">
            <button
              className={activeFolder === 'inbox' ? 'active' : ''}
              onClick={() => setActiveFolder('inbox')}
            >
              📥 Inbox {stats.unread > 0 && <span className="badge">{stats.unread}</span>}
            </button>
            <button
              className={activeFolder === 'outbox' ? 'active' : ''}
              onClick={() => setActiveFolder('outbox')}
            >
              📤 Outbox
            </button>
            <button
              className={activeFolder === 'archived' ? 'active' : ''}
              onClick={() => setActiveFolder('archived')}
            >
              📦 Archived
            </button>
            <button
              className={activeFolder === 'trash' ? 'active' : ''}
              onClick={() => setActiveFolder('trash')}
            >
              🗑️ Trash
            </button>
          </div>

          <div className="mailbox-stats">
            <h3>📊 Statistics</h3>
            <ul>
              <li>📥 Inbox: {stats.totalInbox}</li>
              <li>📤 Outbox: {stats.totalOutbox}</li>
              <li>⚠️ Failed: {stats.failed}</li>
            </ul>
          </div>
        </div>

        {/* Main panel */}
        <div className="mailbox-main">
          {/* Email list */}
          <div className="email-list">
            {loading ? (
              <div className="loading">Loading emails...</div>
            ) : emails.length === 0 ? (
              <div className="no-emails">No emails found</div>
            ) : (
              emails.map(email => (
                <div
                  key={email._id}
                  className={`email-item ${email.status === 'sent' ? 'unread' : ''} ${
                    selectedEmail?._id === email._id ? 'selected' : ''
                  }`}
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="email-item-header">
                    <span className="sender">{email.sender.name}</span>
                    <span className="date">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="subject">{email.subject}</div>
                  <div className="preview">{email.content.text.substring(0, 100)}...</div>
                </div>
              ))
            )}
          </div>

          {/* Email view */}
          {selectedEmail && (
            <div className="email-view">
              <div className="email-view-header">
                <h3>{selectedEmail.subject}</h3>
                <div className="email-actions">
                  <button onClick={() => handleMove(selectedEmail._id, 'archived')}>
                    📦 Archive
                  </button>
                  <button onClick={() => handleMove(selectedEmail._id, 'trash')}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <div className="email-metadata">
                <p>
                  <strong>From:</strong> {selectedEmail.sender.name} ({selectedEmail.sender.email})
                </p>
                <p>
                  <strong>To:</strong> {selectedEmail.recipients[0].name} ({selectedEmail.recipients[0].email})
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(selectedEmail.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Priority:</strong>{' '}
                  <span className={`priority-${selectedEmail.priority || 'normal'}`}>
                    {selectedEmail.priority || 'Normal'}
                  </span>
                </p>
              </div>
              <div className="email-body">{selectedEmail.content.text}</div>
              {selectedEmail.attachments?.length > 0 && (
                <div className="email-attachments">
                  <h4>📎 Attachments</h4>
                  <ul>
                    {selectedEmail.attachments.map((att, index) => (
                      <li key={index}>
                        <a href={att.path} target="_blank" rel="noopener noreferrer">
                          {att.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="compose-modal">
          <div className="compose-content">
            <div className="compose-header">
              <h3>✉️ Compose New Message</h3>
              <button onClick={() => setComposing(false)} className="close-modal">
                ×
              </button>
            </div>
            <form onSubmit={handleComposeSubmit} className="compose-form">
              <div className="form-group">
                <label>To:</label>
                <input
                  type="email"
                  value={composeForm.receiverEmail}
                  onChange={e =>
                    setComposeForm(prev => ({ ...prev, receiverEmail: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={e =>
                    setComposeForm(prev => ({ ...prev, subject: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={composeForm.message}
                  onChange={e =>
                    setComposeForm(prev => ({ ...prev, message: e.target.value }))
                  }
                  required
                  rows="10"
                />
              </div>
              <div className="form-group">
                <label>Attachments:</label>
                <input
                  type="file"
                  multiple
                  onChange={e =>
                    setComposeForm(prev => ({
                      ...prev,
                      attachments: Array.from(e.target.files)
                    }))
                  }
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .mailbox {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }

        .mailbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .compose-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .refresh-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .message {
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .message.success {
          background: #E8F5E9;
          color: #2E7D32;
        }

        .message.error {
          background: #FFEBEE;
          color: #C62828;
        }

        .close-message {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 20px;
        }

        .search-bar {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }

        .search-bar input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .mailbox-content {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 20px;
          height: calc(100vh - 300px);
        }

        .mailbox-sidebar {
          border-right: 1px solid #eee;
        }

        .folder-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .folder-list button {
          text-align: left;
          padding: 10px;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .folder-list button.active {
          background: #E3F2FD;
          color: #1976D2;
        }

        .badge {
          background: #F44336;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 12px;
        }

        .mailbox-stats {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .mailbox-stats ul {
          list-style: none;
          padding: 0;
        }

        .mailbox-stats li {
          margin-bottom: 10px;
        }

        .mailbox-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          overflow: hidden;
        }

        .email-list {
          overflow-y: auto;
          border-right: 1px solid #eee;
        }

        .email-item {
          padding: 15px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }

        .email-item:hover {
          background: #f5f5f5;
        }

        .email-item.unread {
          background: #f8f9fa;
          font-weight: 500;
        }

        .email-item.selected {
          background: #E3F2FD;
        }

        .email-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .subject {
          font-weight: 500;
          margin-bottom: 5px;
        }

        .preview {
          color: #666;
          font-size: 14px;
        }

        .email-view {
          padding: 20px;
        }

        .email-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .email-actions {
          display: flex;
          gap: 10px;
        }

        .email-metadata {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .email-body {
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .priority-high {
          color: #d32f2f;
          font-weight: 500;
        }

        .priority-medium {
          color: #f57c00;
          font-weight: 500;
        }

        .priority-normal {
          color: #388e3c;
        }

        .compose-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .compose-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 600px;
          max-width: 90%;
        }

        .compose-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .close-modal {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }

        .compose-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .loading {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        .no-emails {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        @media (max-width: 768px) {
          .mailbox-content {
            grid-template-columns: 1fr;
          }

          .mailbox-main {
            grid-template-columns: 1fr;
          }

          .email-list {
            border-right: none;
          }

          .email-view {
            display: none;
          }

          .email-view.active {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: 100;
          }
        }
      `}</style>
    </div>
  );
}