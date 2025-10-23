import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function testEmailConnection() {
    console.log('Testing email connection...');
    console.log('Email User:', process.env.EMAIL_USER);
    
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Verify connection
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Email service connection successful!');

        // Send test email
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Team Performance Dashboard" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "Test Email Connection",
            text: "This is a test email to verify the connection.",
            html: "<b>This is a test email to verify the connection.</b>"
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageURL(info));

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testEmailConnection();