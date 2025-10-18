import { google } from "googleapis";
import config from '../config/env.js';

console.log('Initializing Google Auth service...');

/**
 * Gets an authenticated Google Auth client for accessing Google APIs
 * @returns {Promise<google.auth.GoogleAuth>} Authenticated Google Auth client
 */
export async function getGoogleAuth() {
  try {
    console.log('Initializing Google Auth...');
    
    // Format the private key with proper newlines
    const privateKey = config.google.privateKey.replace(/\\n/g, '\n');
    
    // Create auth client with credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: config.google.projectId,
        private_key: privateKey,
        client_email: config.google.clientEmail,
        client_id: config.google.clientId
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose'
      ]
    });

    // Initialize and verify the auth client
    const client = await auth.getClient();
    console.log('Successfully authenticated with service account:', config.google.clientEmail);
    
    return auth;
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}