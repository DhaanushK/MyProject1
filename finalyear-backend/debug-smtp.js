import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Debug Environment Variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***HIDDEN***' : 'NOT FOUND');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***HIDDEN***' : 'NOT FOUND');

// Test basic nodemailer
import nodemailer from 'nodemailer';

async function debugSMTPTest() {
  try {
    console.log('\n🔄 Testing SMTP with debug info...');
    
    const config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    };
    
    console.log('Config user:', config.auth.user);
    console.log('Config pass exists:', !!config.auth.pass);
    console.log('Config pass length:', config.auth.pass ? config.auth.pass.length : 0);
    
    if (!config.auth.user || !config.auth.pass) {
      throw new Error('Missing email credentials in environment variables');
    }
    
    console.log('\n📧 Creating transporter...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('✅ Transporter created, verifying...');
    await transporter.verify();
    
    console.log('🎉 SMTP connection successful!');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 SOLUTIONS:');
      console.log('1. Check if 2FA is enabled on Gmail');
      console.log('2. Generate new App Password: https://myaccount.google.com/apppasswords');
      console.log('3. Make sure App Password is 16 characters without spaces');
      console.log('4. Try using a different Gmail account for testing');
    }
  }
}

debugSMTPTest();