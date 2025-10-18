import React, { useState } from 'react';

const GoogleSheetsViewer = () => {
  const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID';
  const embedUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/preview`;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '24px',
          color: '#1a1a1a',
          margin: 0,
          fontWeight: '600'
        }}>Team Metrics Sheet</h2>
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <a 
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
          >
            Open in Google Sheets
          </a>
        </div>
      </div>
      
      <div style={{
        width: '100%',
        height: 'calc(100vh - 180px)',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666'
          }}>
            Loading sheet...
          </div>
        )}
        <iframe
          title="Google Sheets Viewer"
          src={embedUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default GoogleSheetsViewer;