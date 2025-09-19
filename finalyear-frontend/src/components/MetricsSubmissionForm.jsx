import { useState } from 'react';
import axios from '../config/axios';

export default function MetricsSubmissionForm() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    ticketsAssigned: '',
    ticketsResolved: '',
    slaBreaches: '',
    reopenedTickets: '',
    clientInteractions: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dateValidation, setDateValidation] = useState({
    isValid: true,
    message: ''
  });

  // Function to validate date on the frontend
  const validateDate = (selectedDate) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const selected = new Date(selectedDate);
    
    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) {
      return { isValid: true, message: '✅ Current day entry allowed' };
    } else if (selected.getTime() === yesterday.getTime()) {
      return { isValid: true, message: '⚠️ Previous day entry (Team Lead permission may be required)' };
    } else if (selected.getTime() < yesterday.getTime()) {
      return { isValid: false, message: '❌ Historical dates are not allowed for editing' };
    } else {
      return { isValid: false, message: '❌ Future dates are not allowed' };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      const validation = validateDate(value);
      setDateValidation(validation);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dateValidation.isValid) {
      setMessage('Please select a valid date');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/metrics/submit', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessage(`✅ ${response.data.message}`);
      
      // Reset form to today's date
      setFormData({
        date: new Date().toISOString().split('T')[0],
        ticketsAssigned: '',
        ticketsResolved: '',
        slaBreaches: '',
        reopenedTickets: '',
        clientInteractions: '',
        remarks: ''
      });
      setDateValidation({ isValid: true, message: '✅ Current day entry allowed' });
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!dateValidation.isValid) {
      setMessage('Please select a valid date for updates');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/metrics/update', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessage(`✅ ${response.data.message}`);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3>📝 Submit Daily Metrics</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          
          {/* Date Input with Validation */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date:
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: dateValidation.isValid ? '1px solid #ddd' : '2px solid #ff4444',
                borderRadius: '4px'
              }}
            />
            {dateValidation.message && (
              <div style={{
                fontSize: '12px',
                marginTop: '5px',
                color: dateValidation.isValid ? '#666' : '#ff4444'
              }}>
                {dateValidation.message}
              </div>
            )}
          </div>

          {/* Metrics Inputs */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tickets Assigned:
            </label>
            <input
              type="number"
              name="ticketsAssigned"
              value={formData.ticketsAssigned}
              onChange={handleInputChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tickets Resolved:
            </label>
            <input
              type="number"
              name="ticketsResolved"
              value={formData.ticketsResolved}
              onChange={handleInputChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              SLA Breaches:
            </label>
            <input
              type="number"
              name="slaBreaches"
              value={formData.slaBreaches}
              onChange={handleInputChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Reopened Tickets:
            </label>
            <input
              type="number"
              name="reopenedTickets"
              value={formData.reopenedTickets}
              onChange={handleInputChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Client Interactions:
            </label>
            <input
              type="number"
              name="clientInteractions"
              value={formData.clientInteractions}
              onChange={handleInputChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Remarks - Full Width */}
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Remarks:
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            placeholder="Any additional comments or notes..."
            rows="3"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading || !dateValidation.isValid}
            style={{
              backgroundColor: !dateValidation.isValid ? '#ccc' : '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: !dateValidation.isValid ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Submitting...' : 'Submit New Entry'}
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading || !dateValidation.isValid}
            style={{
              backgroundColor: !dateValidation.isValid ? '#ccc' : '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: !dateValidation.isValid ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Updating...' : 'Update Existing Entry'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: message.includes('Error') || message.includes('❌') ? '#f8d7da' : '#d4edda',
            color: message.includes('Error') || message.includes('❌') ? '#721c24' : '#155724',
            border: `1px solid ${message.includes('Error') || message.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {message}
          </div>
        )}
      </form>

      {/* Date Validation Info */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>📅 Date Entry Rules:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ <strong>Today:</strong> Always allowed for new entries and updates</li>
          <li>⚠️ <strong>Yesterday:</strong> Allowed for Team Leads or with special permission</li>
          <li>❌ <strong>Past dates:</strong> Not allowed to maintain data integrity</li>
          <li>❌ <strong>Future dates:</strong> Not allowed</li>
        </ul>
      </div>
    </div>
  );
}