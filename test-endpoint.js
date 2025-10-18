// Test script to check the /api/metrics/all endpoint
import axios from 'axios';

const testEndpoint = async () => {
  try {
    console.log('Testing /api/metrics/all endpoint...');
    
    const response = await axios.get('http://localhost:5001/api/metrics/all', {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`, // You'll need to replace this
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    console.log('Individual KPIs:', Object.keys(response.data.individualKPIs || {}));
    console.log('User metrics:', Object.keys(response.data.userMetrics || {}));
    
  } catch (error) {
    console.error('Error testing endpoint:', error.response?.data || error.message);
  }
};

testEndpoint();