import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Generate OAuth2 URL
router.get('/auth/google', authMiddleware, (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ];

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: req.user.email // Pass user email as state to verify on callback
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
    
    // Store tokens securely (you'll need to implement this)
    // For now, we'll just send them back to be stored in frontend
    res.json({
      success: true,
      email: state, // This is the user's email we passed in state
      tokens
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