import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

async function testGoogleCredentials() {
    try {
        console.log('=== Testing Google Credentials ===');
        
        // Check if all required environment variables are set
        const requiredVars = ['GOOGLE_PROJECT_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('❌ Missing environment variables:', missingVars);
            return;
        }
        
        console.log('✅ All environment variables present');
        
        // Try to create credentials object
        const credentials = {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            project_id: process.env.GOOGLE_PROJECT_ID
        };
        
        console.log('📧 Service Account Email:', credentials.client_email);
        console.log('🔑 Private Key Preview:', credentials.private_key.substring(0, 50) + '...');
        
        // Create auth client
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        console.log('🔐 Auth client created successfully');
        
        // Try to get access token
        const authClient = await auth.getClient();
        console.log('✅ Auth client obtained successfully');
        
        // Try to access the spreadsheet
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        const spreadsheetResponse = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
        });
        
        console.log('📊 Spreadsheet access successful!');
        console.log('📄 Spreadsheet title:', spreadsheetResponse.data.properties.title);
        console.log('🗂️ Number of sheets:', spreadsheetResponse.data.sheets.length);
        
        // List sheet names
        const sheetNames = spreadsheetResponse.data.sheets.map(sheet => sheet.properties.title);
        console.log('📋 Sheet names:', sheetNames);
        
        console.log('\n🎉 Google Sheets connection test PASSED!');
        
    } catch (error) {
        console.error('❌ Google Sheets connection test FAILED:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        
        if (error.code) {
            console.error('Error code:', error.code);
        }
        
        if (error.opensslErrorStack) {
            console.error('OpenSSL errors:', error.opensslErrorStack);
        }
    }
}

testGoogleCredentials();