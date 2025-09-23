# Email Integration Testing Guide

## Prerequisites

### 1. Gmail API Setup
Make sure your `credentials.json` file has Gmail API enabled:
```json
{
  // Your existing Google credentials
  // Must have Gmail API and Google Sheets API enabled
}
```

### 2. Enable Gmail API in Google Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Library"
4. Search for "Gmail API" and enable it
5. Make sure your service account has appropriate permissions

## Testing Steps

### 1. Backend Setup
```bash
cd finalyear-backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd finalyear-frontend
npm install
npm run dev
```

### 3. Login as Project Manager
1. Open http://localhost:5173
2. Login with project manager credentials
3. Navigate to "Email Management" tab

### 4. Test Each Email Function

#### A. Team Performance Reports
1. Go to "Team Reports" tab
2. Select team members and date range
3. Click "Send Team Performance Report"
4. Check console for success/error messages

#### B. Individual Feedback
1. Go to "Individual Feedback" tab
2. Select a team member
3. Write feedback message
4. Click "Send Feedback"

#### C. Urgent Alerts
1. Go to "Urgent Alerts" tab
2. Select recipients
3. Write urgent message
4. Click "Send Alert"

#### D. Metrics Reminders
1. Go to "Reminders" tab
2. Select team members who haven't submitted
3. Customize reminder message
4. Click "Send Reminder"

#### E. Email Analytics
1. Go to "Overview" tab
2. Check if analytics load properly
3. Verify charts and statistics

### 5. API Endpoint Testing

You can test backend endpoints directly:

```bash
# Test team data endpoint
curl http://localhost:5000/api/pm-email/team-data

# Test analytics endpoint
curl http://localhost:5000/api/pm-email/analytics

# Test sending team report
curl -X POST http://localhost:5000/api/pm-email/send-team-report \
  -H "Content-Type: application/json" \
  -d '{
    "teamMembers": ["user1@example.com"],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

## Expected Behaviors

### Success Indicators ✅
- Email dashboard loads without errors
- All tabs are functional
- Form submissions show success messages
- Analytics display properly
- No console errors

### Common Issues & Solutions

#### Gmail API Authentication Error
```
Error: Gmail API not authenticated
```
**Solution**: 
1. Verify Gmail API is enabled in Google Console
2. Check service account permissions
3. Ensure credentials.json is properly configured

#### CORS Issues
```
Access to fetch blocked by CORS policy
```
**Solution**: 
1. Verify frontend is running on http://localhost:5173
2. Check server CORS configuration matches

#### Missing Team Data
```
Error: Cannot read team metrics
```
**Solution**: 
1. Ensure Google Sheets service is working
2. Verify sheet permissions
3. Check if team members exist in database

## Security Notes

⚠️ **Important**: 
- This is for testing only
- Use test email addresses
- Don't send emails to actual team members during testing
- Monitor Gmail API usage quotas

## Next Steps

Once PM email system is tested and working:
1. Implement Team Lead email functionality
2. Implement Team Member email functionality
3. Add email templates customization
4. Add email scheduling features

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify Gmail API quotas and permissions
4. Test with simpler API calls first