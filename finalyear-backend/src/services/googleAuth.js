import { google } from "googleapis";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function formatPrivateKey(key) {
  // Ensure the key has proper line breaks
  if (!key.includes('\\n')) {
    return key;
  }
  return key.replace(/\\n/g, '\n');
}

export async function getGoogleAuth() {
  try {
    let credentials;
    
    if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      console.log('Using credentials from environment variable');
      credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    } else {
      console.log('Using credentials from file');
      // Try new credentials file first, fall back to original if needed
      const credentialsPath = join(__dirname, '../../credentials-new.json');
      const fallbackPath = join(__dirname, '../../credentials.json');
      
      try {
        const credentialsFile = await readFile(credentialsPath, 'utf-8');
        credentials = JSON.parse(credentialsFile);
        console.log('Using new credentials file');
      } catch (err) {
        console.log('Falling back to original credentials file');
        const credentialsFile = await readFile(fallbackPath, 'utf-8');
        credentials = JSON.parse(credentialsFile);
      }
    }

    // Format the private key properly
    if (credentials.private_key) {
      credentials.private_key = formatPrivateKey(credentials.private_key);
    }

    console.log('Credentials loaded:', {
      type: credentials.type,
      client_email: credentials.client_email,
      project_id: credentials.project_id,
      private_key_format: credentials.private_key.includes('\n') ? 'multiline' : 'single-line'
    });

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/spreadsheets.readonly"
      ],
    });

    // Test the authentication
    try {
      const client = await auth.getClient();
      console.log('Successfully created auth client');
      return auth;
    } catch (error) {
      console.error('Failed to create auth client:', error);
      throw error;
    }
  } catch (error) {
    console.error("Error setting up Google auth:", error);
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON format in credentials");
    }
    throw new Error(`Failed to initialize Google Sheets authentication: ${error.message}`);
  }
}