import { google } from 'googleapis';
import { getGoogleAuth } from './src/services/googleAuth.js';

async function testEmailConnection() {
  try {
    console.log('🔄 Testing Gmail API connection...');
    
    // Test auth
    const auth = await getGoogleAuth();
    console.log('✅ Google Auth initialized');
    
    // Test Gmail API
    const gmail = google.gmail({ version: 'v1', auth });
    console.log('✅ Gmail API client created');
    
    // Test profile access (this requires less permissions than sending emails)
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail profile accessed:', profile.data.emailAddress);
    
    console.log('🎉 Email service connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Email connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Specific error guidance
    if (error.message.includes('Gmail API has not been used')) {
      console.log('\n💡 SOLUTION: Enable Gmail API in Google Cloud Console:');
      console.log('1. Go to https://console.cloud.google.com/apis/library');
      console.log('2. Search for "Gmail API"');
      console.log('3. Click "Enable"');
    }
    
    if (error.message.includes('insufficient authentication')) {
      console.log('\n💡 SOLUTION: Set up domain-wide delegation:');
      console.log('1. Go to Google Admin Console (admin.google.com)');
      console.log('2. Security > API Controls > Domain-wide Delegation');
      console.log('3. Add your service account client ID');
      console.log('4. Add scopes: https://www.googleapis.com/auth/gmail.send');
    }
    
    return false;
  }
}

testEmailConnection();