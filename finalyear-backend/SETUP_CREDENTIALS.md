# Google Cloud Service Account Setup Guide

## To fix the JWT signature error, you need to create new service account credentials:

### Step 1: Go to Google Cloud Console
1. Open https://console.cloud.google.com
2. Select your project: `civic-shell-471423-u1`

### Step 2: Create a new Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `metrics-service-new`
4. Description: `Service account for team metrics Google Sheets access`
5. Click "Create and Continue"

### Step 3: Add Permissions
1. Grant these roles:
   - "Editor" (for full sheet access)
   - Or "Sheets Editor" if available
2. Click "Continue" and "Done"

### Step 4: Generate Key
1. Click on the newly created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create" - this downloads the JSON file

### Step 5: Update Environment Variables
Replace the values in your .env file with the new credentials:

```
GOOGLE_PROJECT_ID=civic-shell-471423-u1
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[NEW_PRIVATE_KEY_HERE]\n-----END PRIVATE KEY-----
GOOGLE_CLIENT_EMAIL=[NEW_SERVICE_ACCOUNT_EMAIL]
GOOGLE_CLIENT_ID=[NEW_CLIENT_ID]
```

### Step 6: Share Google Sheet
1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80/edit
2. Click "Share"
3. Add the new service account email (from the JSON file)
4. Give it "Editor" permissions
5. Click "Send"

### Step 7: Test
Restart your server and test the connection.

## Alternative: Re-enable API Access
If the above doesn't work, also check:
1. Go to "APIs & Services" > "Library"
2. Search for "Google Sheets API" 
3. Make sure it's enabled
4. If not, click "Enable"

The current credentials might be from an old or deleted service account, which is why the JWT signature is invalid.