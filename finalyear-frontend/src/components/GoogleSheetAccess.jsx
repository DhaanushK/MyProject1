import React, { useState, useCallback } from 'react';
import axios from '../config/axios';

const GoogleSheetAccess = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState(null);

    // Check sheet accessibility
    const checkAccess = useCallback(async () => {
        try {
            const response = await axios.get('/api/sheets/check');
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to check sheet access:', error);
            setStatus({
                success: false,
                accessible: false,
                message: 'Failed to check sheet accessibility'
            });
        }
    }, []);

    // Handle sheet download
    const handleDownload = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/sheets/download', {
                responseType: 'blob',
                timeout: 30000,
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                : 'metrics.xlsx';

            // Create download link
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setError(null);

        } catch (error) {
            console.error('Download error:', error);
            setError(error.response?.data?.message || 'Error downloading file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                    <span className="mr-2">📊</span> Raw Data Access
                </h3>
                <button
                    onClick={checkAccess}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Check Access
                </button>
            </div>

            <p className="text-gray-600 mb-4">
                Download or view the complete Google Sheets data
            </p>

            {status && (
                <div className={`mb-4 p-3 rounded ${
                    status.accessible 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                    {status.message}
                </div>
            )}

            <button
                onClick={handleDownload}
                disabled={loading}
                className={`
                    flex items-center justify-center px-4 py-2 rounded-md
                    ${loading 
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }
                    text-white font-medium transition-colors duration-200
                    w-full sm:w-auto
                `}
            >
                {loading ? (
                    <>
                        <svg 
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                        >
                            <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
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

export default GoogleSheetAccess;