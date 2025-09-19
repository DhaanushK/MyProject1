#!/usr/bin/env node

// Comprehensive Google Cloud Service Account Verification Script

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Google Cloud Service Account Verification');
console.log('============================================');
console.log('');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('  GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID || '❌ Missing');
console.log('  GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL || '❌ Missing');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '❌ Missing');
console.log('  GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Present' : '❌ Missing');
console.log('');

if (process.env.GOOGLE_CLIENT_EMAIL) {
  console.log('🔍 Service Account Analysis:');
  console.log('  Email:', process.env.GOOGLE_CLIENT_EMAIL);
  console.log('  Project:', process.env.GOOGLE_PROJECT_ID);
  console.log('  Expected Console URL:');
  console.log('  🔗 https://console.cloud.google.com/iam-admin/serviceaccounts?project=' + process.env.GOOGLE_PROJECT_ID);
  console.log('');
}

console.log('✅ REQUIRED ACTIONS:');
console.log('');
console.log('1. 🔍 VERIFY SERVICE ACCOUNT EXISTS:');
console.log('   - Go to: https://console.cloud.google.com');
console.log('   - Select project: ' + (process.env.GOOGLE_PROJECT_ID || 'civic-shell-471423-u1'));
console.log('   - Navigate to: IAM & Admin > Service Accounts');
console.log('   - Look for: ' + (process.env.GOOGLE_CLIENT_EMAIL || 'metrics-service-acc@civic-shell-471423-u1.iam.gserviceaccount.com'));
console.log('   - Status should be: ✅ Enabled (not disabled/deleted)');
console.log('');

console.log('2. 🔐 CHECK API PERMISSIONS:');
console.log('   - Go to: APIs & Services > Library');
console.log('   - Search: "Google Sheets API"');
console.log('   - Status should be: ✅ ENABLED');
console.log('   - If not enabled, click "ENABLE"');
console.log('');

console.log('3. 🎯 VERIFY SERVICE ACCOUNT ROLES:');
console.log('   - Go to: IAM & Admin > IAM');
console.log('   - Find: ' + (process.env.GOOGLE_CLIENT_EMAIL || 'your-service-account-email'));
console.log('   - Required roles: "Editor" OR "Service Account Token Creator"');
console.log('');

console.log('4. 🔄 IF SERVICE ACCOUNT IS MISSING:');
console.log('   ⚠️  The service account was likely deleted. Create a new one:');
console.log('   - Go to: IAM & Admin > Service Accounts');
console.log('   - Click: "CREATE SERVICE ACCOUNT"');
console.log('   - Name: team-metrics-service-new');
console.log('   - Grant role: "Editor"');
console.log('   - Create and download JSON key');
console.log('   - Update your .env file with new credentials');
console.log('');

console.log('5. 📊 SHARE GOOGLE SHEET:');
console.log('   - Open: https://docs.google.com/spreadsheets/d/1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80/edit');
console.log('   - Click: "Share"');
console.log('   - Add: ' + (process.env.GOOGLE_CLIENT_EMAIL || 'your-service-account-email'));
console.log('   - Permission: "Editor"');
console.log('   - Click: "Send"');
console.log('');

console.log('6. 🧪 TEST AGAIN:');
console.log('   - After making changes, run: node test-auth.js');
console.log('   - Or restart your server: npm run dev');
console.log('');

// Additional debugging info
if (process.env.GOOGLE_PRIVATE_KEY) {
  const keyStart = process.env.GOOGLE_PRIVATE_KEY.substring(0, 50);
  const keyEnd = process.env.GOOGLE_PRIVATE_KEY.substring(process.env.GOOGLE_PRIVATE_KEY.length - 50);
  console.log('🔑 Private Key Debug:');
  console.log('  Start:', keyStart + '...');
  console.log('  End:', '...' + keyEnd);
  console.log('  Length:', process.env.GOOGLE_PRIVATE_KEY.length);
  console.log('  Has newlines:', process.env.GOOGLE_PRIVATE_KEY.includes('\\n') ? '✅ Yes' : '❌ No');
  console.log('');
}

console.log('💡 TIP: If the service account exists but still shows "account not found",');
console.log('   it might be disabled or the API access was revoked. Check the status');
console.log('   in the Google Cloud Console and re-enable if necessary.');