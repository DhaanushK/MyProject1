import axios from 'axios';

async function testEmailEndpoints() {
  console.log('🔄 Testing Email Dashboard Endpoints...');
  
  const baseURL = 'http://localhost:5000/api';
  
  // You'll need to get a valid token first
  const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token from localStorage
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    console.log('\n1️⃣ Testing connection endpoint...');
    const connectionResponse = await axios.get(`${baseURL}/pm-email/test-connection`, { headers });
    console.log('✅ Connection Response:', connectionResponse.data);
    
    console.log('\n2️⃣ Testing team members endpoint...');
    const teamResponse = await axios.get(`${baseURL}/pm-email/team-members`, { headers });
    console.log('✅ Team Members Response:', teamResponse.data);
    
    console.log('\n3️⃣ Testing email analytics endpoint...');
    const analyticsResponse = await axios.get(`${baseURL}/pm-email/email-analytics`, { headers });
    console.log('✅ Analytics Response:', analyticsResponse.data);
    
  } catch (error) {
    console.error('❌ Endpoint test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication issue - check JWT token');
    }
    if (error.response?.status === 403) {
      console.log('\n💡 Authorization issue - user might not be project manager');
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server is not running - start with: npm start');
    }
  }
}

// Manual test without token (just for connection)
async function testWithoutAuth() {
  console.log('\n\n🔍 Testing without authentication (should get 401)...');
  try {
    const response = await axios.get('http://localhost:5000/api/pm-email/test-connection');
    console.log('Unexpected success:', response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Server is running (got expected 401 auth error)');
    } else {
      console.log('❌ Server issue:', error.message);
    }
  }
}

testWithoutAuth();
console.log('\n📝 To test with authentication:');
console.log('1. Login to your dashboard');
console.log('2. Open browser console (F12)');
console.log('3. Run: localStorage.getItem("token")');
console.log('4. Copy the token and replace "YOUR_JWT_TOKEN_HERE" above');
console.log('5. Run: node test-endpoints.js');