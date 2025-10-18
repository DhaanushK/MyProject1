import express from 'express';
import { downloadSheet } from '../services/exportService.js';

const router = express.Router();

router.get('/download', async (req, res) => {
    try {
        console.log('Starting sheet download...');
        
        // Download the sheet
        const { data, filename, mimeType } = await downloadSheet();
        
        // Set download headers
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', data.length);
        
        // Send the file
        res.send(data);
        
        console.log('Download completed successfully');
    } catch (error) {
        console.error('Download failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download sheet',
            error: error.message
        });
    }
});

// Add a route to check if the export service is accessible
router.get('/check', async (req, res) => {
    try {
        const { success, webViewLink } = await generateExportUrl();
        res.json({
            success: true,
            message: 'Export service is accessible',
            webViewLink
        });
    } catch (error) {
        console.error('Export service check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Export service is not accessible',
            error: error.message
        });
    }
});

export default router;