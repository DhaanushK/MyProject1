import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

async function debugSheetsData() {
    try {
        console.log('=== Debugging Sheets Data ===');
        
        // Create auth client
        const credentials = {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            project_id: process.env.GOOGLE_PROJECT_ID
        };
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        // Get all sheets
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
        });
        
        console.log('📊 Available sheets:', spreadsheet.data.sheets.map(s => s.properties.title));
        
        // Check Winnish's sheet data (first few rows)
        const winnishSheet = 'Winnish Allwin G J';
        console.log(`\n🔍 Checking data from "${winnishSheet}" sheet...`);
        
        // Get header row
        const headerRes = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: `${winnishSheet}!A1:I1`
        });
        
        console.log('📋 Headers:', headerRes.data.values?.[0] || 'No headers found');
        
        // Get first 5 data rows
        const dataRes = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: `${winnishSheet}!A2:I6`
        });
        
        const rows = dataRes.data.values || [];
        console.log(`\n📊 Sample data (${rows.length} rows):`);
        
        rows.forEach((row, index) => {
            const [
                date,
                name,
                email,
                ticketsAssigned,
                ticketsResolved,
                slaBreaches,
                reopenedTickets,
                clientInteractions,
                remarks
            ] = row;
            
            console.log(`Row ${index + 2}:`, {
                date,
                name,
                ticketsAssigned: ticketsAssigned || '(empty)',
                ticketsResolved: ticketsResolved || '(empty)',
                slaBreaches: slaBreaches || '(empty)',
                clientInteractions: clientInteractions || '(empty)',
                parsedAssigned: parseInt(ticketsAssigned, 10) || 0,
                parsedResolved: parseInt(ticketsResolved, 10) || 0
            });
        });
        
        // Calculate totals from sample data
        let totalAssigned = 0;
        let totalResolved = 0;
        let totalInteractions = 0;
        
        rows.forEach(row => {
            totalAssigned += parseInt(row[3], 10) || 0;
            totalResolved += parseInt(row[4], 10) || 0;
            totalInteractions += parseInt(row[7], 10) || 0;
        });
        
        console.log(`\n📈 Sample totals:`, {
            totalAssigned,
            totalResolved,
            totalInteractions,
            completionRate: totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) + '%' : '0%'
        });
        
    } catch (error) {
        console.error('❌ Error debugging sheets data:', error.message);
    }
}

debugSheetsData();