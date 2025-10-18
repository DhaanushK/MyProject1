import { getSheets, validateSheet } from './services/googleSheets.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGoogleSheetsConnection() {
    try {
        console.log('🔍 Testing Google Sheets Configuration...');
        console.log('----------------------------------------');
        
        // Check environment variables
        console.log('1. Checking environment variables...');
        const requiredVars = [
            'GOOGLE_SERVICE_ACCOUNT_EMAIL',
            'GOOGLE_PRIVATE_KEY',
            'GOOGLE_PROJECT_ID',
            'GOOGLE_SPREADSHEET_ID'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        console.log('✅ All required environment variables are present');

        // Initialize Google Sheets client
        console.log('\n2. Initializing Google Sheets client...');
        const sheets = await getSheets();
        console.log('✅ Successfully initialized Google Sheets client');

        // Validate spreadsheet access
        console.log('\n3. Testing spreadsheet access...');
        const isValid = await validateSheet(process.env.GOOGLE_SPREADSHEET_ID);
        if (!isValid) {
            throw new Error('Could not access the specified spreadsheet');
        }
        console.log('✅ Successfully accessed the spreadsheet');

        // Try to read spreadsheet metadata
        console.log('\n4. Reading spreadsheet metadata...');
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            fields: 'properties.title,sheets.properties.title'
        });

        console.log('✅ Successfully read spreadsheet metadata:');
        console.log(`   Title: ${metadata.data.properties.title}`);
        console.log('   Sheets:');
        const sheetsList = metadata.data.sheets;
        for (let i = 0; i < sheetsList.length; i++) {
            const sheet = sheetsList[i];
            console.log(`   - ${sheet.properties.title}`);
        }

        console.log('\n✨ All tests passed successfully!');
        console.log('Your Google Sheets integration is working correctly.');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Google API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        process.exit(1);
    }
}

// Run the test
testGoogleSheetsConnection();