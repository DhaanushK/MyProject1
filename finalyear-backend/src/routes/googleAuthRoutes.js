import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

// Helper function to determine user role
function determineUserRole(email) {
  // Project Manager
  if (email === process.env.EMAIL_USER) {
    return 'project_manager';
  }
  // Team Leads
  if (email === process.env.TL1_EMAIL || email === process.env.TL2_EMAIL) {
    return 'team_lead';
  }
  // Team Members
  if ([
    process.env.TM1_EMAIL,
    process.env.TM2_EMAIL,
    process.env.TM3_EMAIL,
    process.env.TM4_EMAIL
  ].includes(email)) {
    return 'team_member';
  }
  return 'team_member'; // Default role
}

const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Generate OAuth2 URL
router.get('/google/signin', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ 
    success: true,
    authUrl: authorizeUrl 
  });
});

// Handle OAuth2 callback
router.get('/google-callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const { data } = await google.oauth2('v2').userinfo.get({
      auth: oauth2Client
    });

    // Create or update user in your database
    const user = {
      email: data.email,
      name: data.name,
      role: determineUserRole(data.email) // You'll need to implement this function
    };

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      email: user.email,
      role: user.role,
      username: user.name
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete Google OAuth flow',
      error: error.message
    });
  }
});

export default router;