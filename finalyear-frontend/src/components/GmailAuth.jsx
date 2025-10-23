import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

export default function GmailAuth({ userEmail, onAuthComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState('pending'); // pending, authenticating, success, error

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAuthStatus('authenticating');

      // Get the authorization URL
      const { data } = await axios.get('/api/auth/google');
      
      // Open Google OAuth consent screen in a popup
      const popup = window.open(
        data.authUrl,
        'Gmail Authentication',
        'width=600,height=600'
      );

      // Handle the OAuth callback via window messaging
      const handleCallback = async (event) => {
        if (event.origin !== window.location.origin) return;

        try {
          const { tokens, email } = event.data;
          if (tokens && email === userEmail) {
            // Store tokens securely
            await saveTokens(tokens);
            setAuthStatus('success');
            onAuthComplete?.(true);
          }
        } catch (error) {
          console.error('Failed to process authentication:', error);
          setError('Authentication failed. Please try again.');
          setAuthStatus('error');
          onAuthComplete?.(false);
        } finally {
          window.removeEventListener('message', handleCallback);
          popup?.close();
        }
      };

      window.addEventListener('message', handleCallback);
    } catch (error) {
      console.error('Gmail authentication error:', error);
      setError(error.response?.data?.message || 'Failed to connect to Gmail');
      setAuthStatus('error');
      onAuthComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTokens = async (tokens) => {
    try {
      await axios.post('/api/auth/gmail-tokens', {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(Date.now() + tokens.expires_in * 1000)
      });
    } catch (error) {
      console.error('Failed to save Gmail tokens:', error);
      throw error;
    }
  };

  return (
    <div className="gmail-auth-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gmail Integration</h2>
        <span className={`status-badge ${authStatus}`}>
          {authStatus === 'success' ? '✓ Connected' : 
           authStatus === 'authenticating' ? 'Connecting...' : 
           authStatus === 'error' ? '× Failed' : 
           'Not Connected'}
        </span>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Connect your Gmail Account</h3>
          <p className="text-gray-600">
            Connect your Gmail account to enable email features directly in the dashboard.
          </p>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <img 
              src="/gmail-icon.png" 
              alt="Gmail" 
              className="w-6 h-6 mr-2"
            />
            <span className="text-gray-700">{userEmail}</span>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-md 
              ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} 
              text-white font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : 'Connect Gmail'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Features List */}
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Features enabled with Gmail integration:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Direct access to Gmail inbox
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Email threading and labels
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Better attachment handling
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .status-badge {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-badge.success {
          background-color: #def7ec;
          color: #03543f;
        }
        .status-badge.error {
          background-color: #fde8e8;
          color: #9b1c1c;
        }
        .status-badge.authenticating {
          background-color: #e1effe;
          color: #1e429f;
        }
        .status-badge.pending {
          background-color: #f3f4f6;
          color: #374151;
        }
      `}</style>
    </div>
  );
}