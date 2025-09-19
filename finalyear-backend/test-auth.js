import { getGoogleAuth } from './src/services/googleAuth.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

async function testAuth() {
  try {
    console.log('🔑 Testing Google Sheets authentication...');
    
    const auth = await getGoogleAuth();
    console.log('✅ Authentication successful!');
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('📊 Testing spreadsheet access...');
    const spreadsheetId = '1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80';
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    console.log('✅ Spreadsheet access successful!');
    console.log('📋 Available sheets:', response.data.sheets.map(s => s.properties.title));
    
    // Test reading data from a sheet
    const sheetsData = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Kanishkka R!A1:I10' // Try to read from Kanishkka R sheet
    });
    
    console.log('✅ Data reading successful!');
    console.log('📝 Sample data:', sheetsData.data.values?.slice(0, 3));
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    console.error('📝 Full error:', error);
  }
}

testAuth();