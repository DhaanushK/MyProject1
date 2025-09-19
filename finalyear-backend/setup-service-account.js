#!/usr/bin/env node

// This script helps you create a new Google Cloud service account
// Run this after creating the service account in Google Cloud Console

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Google Cloud Service Account Setup Helper');
console.log('==========================================');
console.log('');

console.log('📋 Steps to create a new service account:');
console.log('');
console.log('1. Go to: https://console.cloud.google.com');
console.log('2. Select project: civic-shell-471423-u1');
console.log('3. Navigate to: IAM & Admin > Service Accounts');
console.log('4. Click: "CREATE SERVICE ACCOUNT"');
console.log('');
console.log('5. Service account details:');
console.log('   - Name: team-metrics-service');
console.log('   - ID: team-metrics-service');
console.log('   - Description: Service account for team metrics Google Sheets access');
console.log('');
console.log('6. Grant roles:');
console.log('   - Editor (or Google Sheets API access)');
console.log('');
console.log('7. Create and download JSON key:');
console.log('   - Click on the created service account');
console.log('   - Go to "Keys" tab');
console.log('   - Click "ADD KEY" > "Create new key"');
console.log('   - Select "JSON" format');
console.log('   - Download the file');
console.log('');
console.log('8. Save the downloaded JSON file as: credentials-new.json');
console.log('   in this directory: ' + __dirname);
console.log('');
console.log('9. Run this script again to update your .env file');
console.log('');

// Check if credentials file exists
const credentialsPath = path.join(__dirname, 'credentials-new.json');
if (fs.existsSync(credentialsPath)) {
  console.log('✅ Found credentials-new.json file!');
  console.log('🔄 Updating .env file...');
  
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    console.log('📋 Service Account Details:');
    console.log('   - Email:', credentials.client_email);
    console.log('   - Project ID:', credentials.project_id);
    console.log('   - Client ID:', credentials.client_id);
    
    // Update .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update individual environment variables
    envContent = envContent.replace(/GOOGLE_PROJECT_ID=.*/, `GOOGLE_PROJECT_ID=${credentials.project_id}`);
    envContent = envContent.replace(/GOOGLE_CLIENT_EMAIL=.*/, `GOOGLE_CLIENT_EMAIL=${credentials.client_email}`);
    envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/, `GOOGLE_CLIENT_ID=${credentials.client_id}`);
    envContent = envContent.replace(/GOOGLE_PRIVATE_KEY=.*/, `GOOGLE_PRIVATE_KEY=${credentials.private_key}`);
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Updated .env file with new credentials!');
    console.log('');
    console.log('🔗 Next step: Share the Google Sheet with this email:');
    console.log('   📧 ' + credentials.client_email);
    console.log('');
    console.log('📊 Google Sheet URL:');
    console.log('   🔗 https://docs.google.com/spreadsheets/d/1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80/edit');
    console.log('');
    console.log('🔧 Steps to share:');
    console.log('   1. Open the Google Sheet URL above');
    console.log('   2. Click the "Share" button');
    console.log('   3. Add this email: ' + credentials.client_email);
    console.log('   4. Set permission to "Editor"');
    console.log('   5. Click "Send"');
    console.log('');
    console.log('🚀 After sharing, restart your server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error reading credentials file:', error.message);
  }
} else {
  console.log('⏳ Waiting for credentials-new.json file...');
  console.log('   Please follow the steps above to create and download the service account key.');
}