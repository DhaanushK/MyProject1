import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBasicAuth() {
  try {
    console.log('📁 Loading credentials...');
    const credentialsPath = path.join(__dirname, 'src/config/credentials.json');
    console.log('Credentials path:', credentialsPath);
    
    const credentialsFile = await readFile(credentialsPath, 'utf-8');
    console.log('✅ File read successful');
    
    const credentials = JSON.parse(credentialsFile);
    console.log('✅ JSON parse successful');
    console.log('🔑 Client email:', credentials.client_email);
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    console.log('✅ Auth client created');

    // Test authentication
    const client = await auth.getClient();
    console.log('✅ Authentication successful!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBasicAuth();