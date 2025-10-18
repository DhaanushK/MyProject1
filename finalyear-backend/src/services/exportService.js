import { google } from 'googleapis';
import { sheets } from './googleSheets.js';
import config from '../config/env.js';

/**
 * Downloads Google Sheet as Excel file
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function downloadSheet() {
    try {
        console.log('Initializing sheet download...');
        const auth = sheets.auth;
        const drive = google.drive({ version: 'v3', auth });

        console.log('Fetching spreadsheet metadata...');
        // Get file metadata first
        const fileInfo = await drive.files.get({
            fileId: config.google.spreadsheetId,
            fields: 'name,mimeType'
        });

        console.log('Requesting sheet export...');
        // Request the file export
        const response = await drive.files.export({
            fileId: config.google.spreadsheetId,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }, {
            responseType: 'arraybuffer'
        });

        console.log('Export successful, returning data...');
        return {
            data: Buffer.from(response.data),
            filename: `${fileInfo.data.name || 'metrics'}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
    } catch (error) {
        console.error('Error downloading sheet:', error);
        throw new Error(`Failed to download sheet: ${error.message}`);
    }
}