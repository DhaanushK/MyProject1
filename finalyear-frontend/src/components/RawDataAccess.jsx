import React, { useState } from 'react';
import axios from '../config/axios';

const RawDataAccess = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Initiating download request...');
      const response = await axios.get('/api/export/download', {
        responseType: 'blob',
        withCredentials: true,
        timeout: 60000, // Increased timeout to 60 seconds
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      console.log('Received response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length']
      });
      
      // Check if we got a blob response
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/['"]/g, '')
        : 'metrics.xlsx';
      
      // Create a blob URL
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      if (blob.size === 0) {
        throw new Error('Received empty file');
      }

      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      
      console.log('Starting download for file:', fileName);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setError(null);
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error
        if (error.response.data instanceof Blob) {
          // Try to read the blob as text to get the error message
          const text = await error.response.data.text();
          try {
            const errorData = JSON.parse(text);
            setError(errorData.message || 'Server error occurred');
          } catch {
            setError(text || 'Server error occurred');
          }
        } else {
          setError(error.response.data?.message || `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Error in request setup
        setError(`Error preparing download: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-2 flex items-center">
        <span className="mr-2">📊</span> Raw Data Access
      </h3>
      <p className="text-gray-600 mb-4">Download or view the complete Google Sheets data:</p>
      
      <button 
        className={`
          flex items-center justify-center px-4 py-2 rounded-md
          ${loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'} 
          text-white font-medium transition-colors duration-200
          w-full sm:w-auto
        `}
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Downloading...
          </>
        ) : (
          <>
            <span className="mr-2">⬇️</span>
            Download Google Sheet (Excel)
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default RawDataAccess;