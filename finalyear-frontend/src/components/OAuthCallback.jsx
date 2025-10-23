import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL params
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // This contains the user's email

        if (code) {
          // Send message to parent window
          window.opener.postMessage({ code, state }, window.location.origin);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
      } finally {
        // Close the popup
        window.close();
      }
    };

    handleCallback();
  }, [location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
        <p className="text-gray-600">Please wait while we complete the process...</p>
        <div className="mt-4">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    </div>
  );
}