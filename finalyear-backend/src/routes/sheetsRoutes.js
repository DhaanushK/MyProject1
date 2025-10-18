import express from 'express';
import { downloadGoogleSheet } from '../controllers/sheetsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Route to download Google Sheet as Excel
router.get('/download', authMiddleware, downloadGoogleSheet);

export default router;