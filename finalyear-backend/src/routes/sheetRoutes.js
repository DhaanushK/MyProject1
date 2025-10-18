import express from 'express';
import { readSheetData, exportAsExcel, validateSheet } from '../services/googleSheets.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Download sheet as Excel
 */
router.get('/download', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        
        // Validate sheet access
        const isValid = await validateSheet(spreadsheetId);
        if (!isValid) {
            return res.status(404).json({
                success: false,
                message: 'Sheet not found or not accessible'
            });
        }

        // Export sheet
        const { data, filename } = await exportAsExcel(spreadsheetId);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', data.length);

        // Send file
        res.send(data);

    } catch (error) {
        console.error('Error in /sheets/download:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download sheet',
            error: error.message
        });
    }
});

/**
 * Check sheet accessibility
 */
router.get('/check', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        const isValid = await validateSheet(spreadsheetId);
        
        res.json({
            success: true,
            accessible: isValid,
            message: isValid ? 'Sheet is accessible' : 'Sheet is not accessible'
        });
    } catch (error) {
        console.error('Error in /sheets/check:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check sheet accessibility',
            error: error.message
        });
    }
});

export default router;