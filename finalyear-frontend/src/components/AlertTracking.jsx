import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

export default function AlertTracking({ alertId }) {
    const [alertStatus, setAlertStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAlertStatus();
    }, [alertId]);

    const fetchAlertStatus = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/alert-tracking/status/${alertId}`);
            setAlertStatus(response.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading alert status...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!alertStatus) return <div>No status available</div>;

    return (
        <div className="alert-tracking">
            <h3>Alert Tracking</h3>
            <div className="status-grid">
                {alertStatus.recipients.map((recipient, index) => (
                    <div key={index} className="recipient-status">
                        <div className="email">{recipient.email}</div>
                        <div className={`delivery-status ${recipient.deliveryStatus}`}>
                            {recipient.deliveryStatus.toUpperCase()}
                        </div>
                        <div className={`read-status ${recipient.readStatus ? 'read' : 'unread'}`}>
                            {recipient.readStatus ? '✓ Read' : '○ Unread'}
                            {recipient.readTimestamp && (
                                <span className="timestamp">
                                    at {new Date(recipient.readTimestamp).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .alert-tracking {
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .status-grid {
                    display: grid;
                    gap: 15px;
                    margin-top: 15px;
                }

                .recipient-status {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 10px;
                    padding: 10px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    align-items: center;
                }

                .email {
                    font-weight: 500;
                    color: #333;
                }

                .delivery-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 500;
                }

                .delivery-status.sent {
                    background: #e3f2fd;
                    color: #1976d2;
                }

                .delivery-status.delivered {
                    background: #e8f5e9;
                    color: #2e7d32;
                }

                .delivery-status.failed {
                    background: #ffebee;
                    color: #c62828;
                }

                .read-status {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 14px;
                }

                .read-status.read {
                    color: #2e7d32;
                }

                .read-status.unread {
                    color: #757575;
                }

                .timestamp {
                    font-size: 12px;
                    color: #666;
                    margin-left: 5px;
                }
            `}</style>
        </div>
    );
}