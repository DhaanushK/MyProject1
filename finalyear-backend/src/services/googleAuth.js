import { google } from "googleapis";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function formatPrivateKey(key) {
  if (!key) {
    throw new Error('Private key is missing from credentials');
  }

  // First, normalize the key by removing any existing line breaks and spaces
  let normalizedKey = key.replace(/\s/g, '');

  // If the key is already properly formatted with actual newlines, return it
  if (key.includes('\n') && 
      key.includes('-----BEGIN PRIVATE KEY-----') && 
      key.includes('-----END PRIVATE KEY-----')) {
    return key;
  }

  // Replace escaped newlines with actual newlines
  if (normalizedKey.includes('\\n')) {
    normalizedKey = normalizedKey.replace(/\\n/g, '\n');
  }

  // Ensure proper formatting of the key
  let formattedKey = normalizedKey;
  if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----\n')) {
    formattedKey = formattedKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
  }
  if (!formattedKey.endsWith('\n-----END PRIVATE KEY-----')) {
    formattedKey = formattedKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  // Add newlines every 64 characters for the key content
  const keyContent = formattedKey
    .replace('-----BEGIN PRIVATE KEY-----\n', '')
    .replace('\n-----END PRIVATE KEY-----', '');
  const keyChunks = keyContent.match(/.{1,64}/g) || [];
  formattedKey = `-----BEGIN PRIVATE KEY-----\n${keyChunks.join('\n')}\n-----END PRIVATE KEY-----`;

  // Final validation
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || 
      !formattedKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format');
  }

  return formattedKey;
}

export async function getGoogleAuth() {
  try {
    let credentials;
    
    // Try environment variables first (individual fields)
    if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
      console.log('Using individual credentials from environment variables');
      credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        universe_domain: 'googleapis.com'
      };
    }
    // Try JSON environment variable
    else if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      console.log('Using credentials from JSON environment variable');
      try {
        let rawCredentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
        // Handle potential double-escaping of quotes and newlines
        rawCredentials = rawCredentials.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        credentials = JSON.parse(rawCredentials);
        console.log('Successfully parsed credentials from environment variable');
      } catch (error) {
        console.error('Failed to parse credentials from environment variable:', error);
        throw new Error('Invalid credentials format in environment variable');
      }
    } 
    // Fall back to files
    else {
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
        try {
          const credentialsFile = await readFile(fallbackPath, 'utf-8');
          credentials = JSON.parse(credentialsFile);
        } catch (error) {
          console.error('Failed to read credentials from both files');
          throw new Error('No valid credentials found');
        }
      }
    }

    // Validate required credential fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required credential fields: ${missingFields.join(', ')}`);
    }

    // Format the private key properly if using JSON credentials
    if (process.env.GOOGLE_SHEETS_CREDENTIALS && credentials.private_key) {
      credentials.private_key = formatPrivateKey(credentials.private_key);
    }

    console.log('Credentials loaded:', {
      type: credentials.type,
      client_email: credentials.client_email,
      project_id: credentials.project_id,
      private_key_format: credentials.private_key.includes('\n') ? 'multiline' : 'single-line',
      private_key_start: credentials.private_key.substring(0, 30) + '...'
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
      console.error('Auth error details:', error.message);
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