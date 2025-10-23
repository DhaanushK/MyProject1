import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import AlertTracking from '../models/AlertTracking.js';

const router = express.Router();

// Get status of a specific alert
router.get('/status/:alertId', authMiddleware, async (req, res) => {
    try {
        const alert = await AlertTracking.findOne({ alertId: req.params.alertId });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        res.json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all alerts sent to a specific recipient
router.get('/recipient/:email', authMiddleware, async (req, res) => {
    try {
        const alerts = await AlertTracking.find({
            'recipients.email': req.params.email
        });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark alert as read
router.post('/mark-read/:alertId', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const alert = await AlertTracking.findOne({ alertId: req.params.alertId });
        
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        const recipient = alert.recipients.find(r => r.email === email);
        if (recipient) {
            recipient.readStatus = true;
            recipient.readTimestamp = new Date();
            await alert.save();
        }

        res.json({ message: 'Alert marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get recent alerts
router.get('/recent', authMiddleware, async (req, res) => {
    try {
        const alerts = await AlertTracking.find()
            .sort({ sentAt: -1 })
            .limit(10);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;