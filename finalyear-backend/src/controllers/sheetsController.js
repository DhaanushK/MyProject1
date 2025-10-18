import { google } from "googleapis";
import { sheets } from '../services/googleSheets.js';
import { Readable } from 'stream';

export const downloadGoogleSheet = async (req, res) => {
    try {
        const auth = sheets.auth;
        const drive = google.drive({ version: 'v3', auth });

        // Get the spreadsheet to access its title
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        });

        // Export the spreadsheet as Excel
        const response = await drive.files.export({
            fileId: process.env.GOOGLE_SPREADSHEET_ID,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }, {
            responseType: 'stream'
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${spreadsheet.data.properties.title}.xlsx"`);
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Pipe the file stream to response
        response.data.pipe(res);
    } catch (error) {
        console.error('Error downloading sheet:', error);
        res.status(500).json({ 
            message: 'Error downloading Google Sheet',
            error: error.message 
        });
    }
};