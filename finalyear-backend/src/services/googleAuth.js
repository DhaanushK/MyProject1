import { google } from "googleapis";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('googleAuth.js loaded from:', __dirname);

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
    // Load credentials from file
    const credentialsPath = join(__dirname, '../config/credentials.json');
    console.log('Loading credentials from:', credentialsPath);
    
    const credentialsFile = await readFile(credentialsPath, 'utf-8');
    console.log('Credentials file read successfully');
    
    const credentials = JSON.parse(credentialsFile);
    console.log('Credentials parsed successfully');

    // Validate credentials
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in credentials: ${missingFields.join(', ')}`);
    }

    console.log('Using service account:', credentials.client_email);

    // Create auth client with credentials directly
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
        project_id: credentials.project_id,
        type: 'service_account'
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    });

    // Test the authentication
    const client = await auth.getClient();
    console.log('Successfully created and verified auth client');

    return auth;
  } catch (error) {
    console.error('Error in getGoogleAuth:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}