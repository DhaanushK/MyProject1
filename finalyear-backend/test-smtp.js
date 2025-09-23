import dotenv from 'dotenv';
import SMTPEmailService from './src/services/smtpEmailService.js';

// Load environment variables
dotenv.config();

async function testSMTPService() {
  try {
    console.log('🔄 Testing SMTP Email Service...');
    
    // Test initialization
    await SMTPEmailService.initialize();
    console.log('✅ SMTP service initialized successfully!');
    
    console.log('\n✅ SMTP Email Service is working!');
    console.log('\n📧 Setup Steps:');
    console.log('1. Install nodemailer: npm install nodemailer');
    console.log('2. Set up environment variables:');
    console.log('   EMAIL_USER=dhaanushk1110@gmail.com');
    console.log('   GMAIL_APP_PASSWORD=your-16-digit-app-password');
    console.log('3. Enable 2FA and create App Password:');
    console.log('   https://myaccount.google.com/apppasswords');
    
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 SOLUTION:');
      console.log('1. Enable 2-factor authentication on Gmail');
      console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('3. Use App Password in EMAIL_PASSWORD environment variable');
    }
    
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('\n💡 SOLUTION: Check internet connection and SMTP server settings');
    }
  }
}

testSMTPService();