import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

function EmailBox({ role, userEmail }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');

  useEffect(() => {
    fetchEmails();
  }, [activeTab, userEmail]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching emails with params:', { role, userEmail, activeTab }); // Debug log

      const response = await axios.get(`/api/emails/${activeTab}`, {
        params: { email: userEmail }
      });

      setEmails(response.data.emails || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      setError(error.response?.data?.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="email-box loading">
        <div className="loading-spinner">Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-box error">
        <div className="error-message">{error}</div>
        <button onClick={fetchEmails} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="email-box">
      <div className="email-tabs">
        <button 
          className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          📥 Inbox
        </button>
        <button 
          className={`tab-btn ${activeTab === 'outbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('outbox')}
        >
          📤 Sent
        </button>
      </div>

      <div className="email-list">
        {emails.length === 0 ? (
          <div className="no-emails">
            <p>{activeTab === 'inbox' ? 'No emails in inbox' : 'No outgoing emails'}</p>
          </div>
        ) : (
          emails.map((email, index) => (
            <div key={index} className="email-item">
              <div className="email-header">
                <span className="email-from">
                  {activeTab === 'inbox' ? 
                    `From: ${email.fromName || email.from}` : 
                    `To: ${email.toNames?.join(', ') || email.to?.join(', ')}`
                  }
                </span>
                <span className="email-date">{new Date(email.createdAt).toLocaleString()}</span>
              </div>
              <div className="email-subject">{email.subject}</div>
              {email.priority && (
                <span className={`priority-badge ${email.priority}`}>
                  {email.priority.charAt(0).toUpperCase() + email.priority.slice(1)}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .email-box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }

        .email-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: #f0f2f5;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #0ea5e9;
          color: white;
        }

        .email-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .email-item {
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .email-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .email-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.9em;
          color: #64748b;
        }

        .email-subject {
          font-weight: 500;
          color: #1e293b;
        }

        .priority-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          margin-top: 8px;
        }

        .priority-badge.high {
          background: #fee2e2;
          color: #dc2626;
        }

        .priority-badge.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .priority-badge.normal {
          background: #e0f2fe;
          color: #0284c7;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          color: #6b7280;
        }

        .error-message {
          color: #dc2626;
          margin-bottom: 10px;
        }

        .retry-btn {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .retry-btn:hover {
          background: #dc2626;
        }

        .no-emails {
          text-align: center;
          color: #6b7280;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

export default EmailBox;
