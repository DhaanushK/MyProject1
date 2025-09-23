import { google } from 'googleapis';
import { getGoogleAuth } from './src/services/googleAuth.js';

async function detailedEmailTest() {
  try {
    console.log('🔄 Running detailed Gmail API diagnostics...');
    
    // Test 1: Basic auth
    console.log('\n1️⃣ Testing Google Auth...');
    const auth = await getGoogleAuth();
    console.log('✅ Google Auth successful');
    
    // Test 2: Gmail client creation
    console.log('\n2️⃣ Creating Gmail client...');
    const gmail = google.gmail({ version: 'v1', auth });
    console.log('✅ Gmail client created');
    
    // Test 3: Try to get auth token info
    console.log('\n3️⃣ Testing authentication token...');
    const authClient = await auth.getClient();
    const tokenInfo = await authClient.getAccessToken();
    console.log('✅ Access token obtained');
    
    // Test 4: Try profile access (less restrictive)
    console.log('\n4️⃣ Testing Gmail profile access...');
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log('✅ Profile access successful:', profile.data.emailAddress);
    } catch (profileError) {
      console.log('❌ Profile access failed:', profileError.message);
      
      // This suggests we need domain delegation or different approach
      if (profileError.message.includes('Precondition check failed')) {
        console.log('\n💡 DIAGNOSIS: Service account needs domain-wide delegation or different auth method');
        
        console.log('\n🔧 SOLUTION OPTIONS:');
        console.log('Option 1 - Domain-wide Delegation (Recommended):');
        console.log('1. Go to https://admin.google.com');
        console.log('2. Security > API Controls > Domain-wide Delegation');
        console.log('3. Add client ID: 110289782123569082700');
        console.log('4. Scopes: https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.compose');
        
        console.log('\nOption 2 - Use OAuth2 instead of Service Account:');
        console.log('1. Create OAuth2 credentials in Google Cloud Console');
        console.log('2. Use user consent flow for email access');
        
        console.log('\nOption 3 - Use a different email service:');
        console.log('1. Use Nodemailer with SMTP (Gmail, Outlook, etc.)');
        console.log('2. Use SendGrid, Mailgun, or similar service');
      }
    }
    
    // Test 5: Check available scopes
    console.log('\n5️⃣ Checking authentication scopes...');
    const scopes = auth._getDefaultScopes ? auth._getDefaultScopes() : 'Unknown';
    console.log('Available scopes:', scopes);
    
  } catch (error) {
    console.error('\n❌ Detailed test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('💡 Credentials file not found - check file path');
    }
  }
}

// Also test a simple SMTP alternative
async function testSMTPAlternative() {
  console.log('\n\n📧 Testing SMTP Alternative (Nodemailer)...');
  
  // This is just a configuration test, not actually sending
  const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com', // Replace with actual email
      pass: 'your-app-password'     // Replace with Gmail app password
    }
  };
  
  console.log('SMTP Configuration example:');
  console.log(JSON.stringify(smtpConfig, null, 2));
  console.log('\n💡 SMTP Setup Steps:');
  console.log('1. Enable 2-factor authentication on Gmail');
  console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('3. Use App Password instead of regular password');
  console.log('4. Install nodemailer: npm install nodemailer');
}

detailedEmailTest().then(() => {
  testSMTPAlternative();
}).catch(console.error);