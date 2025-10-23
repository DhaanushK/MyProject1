import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import EmailLog from '../models/EmailLog.js';

const router = express.Router();

// Get emails (inbox or outbox)
router.get('/:box', authMiddleware, async (req, res) => {
  try {
    const { box } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    let query = {};
    if (box === 'inbox') {
      query = { 'recipients.email': email };
    } else if (box === 'outbox') {
      query = { 'sender.email': email };
    } else {
      return res.status(400).json({ message: 'Invalid box parameter' });
    }

    const emails = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ 
      success: true,
      emails: emails.map(email => ({
        _id: email._id,
        from: email.sender.email,
        fromName: email.sender.name,
        to: email.recipients.map(r => r.email),
        toNames: email.recipients.map(r => r.name),
        subject: email.subject,
        text: email.content.text || '',
        html: email.content.html || '',
        type: email.type,
        priority: email.priority,
        status: email.status,
        createdAt: email.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch emails',
      error: error.message 
    });
  }
});

// Mark email as read
router.post('/:emailId/read', authMiddleware, async (req, res) => {
  try {
    const { emailId } = req.params;
    const { email } = req.body;

    const emailLog = await EmailLog.findOne({ 
      _id: emailId,
      'recipients.email': email,
      'recipients.status': 'sent'
    });

    if (!emailLog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found or already read' 
      });
    }

    // Find the specific recipient and update their status
    const recipient = emailLog.recipients.find(r => r.email === email);
    if (recipient) {
      recipient.status = 'delivered';
      recipient.readAt = new Date();
      await emailLog.save();
    }

    res.json({ 
      success: true, 
      message: 'Email marked as read'
    });
  } catch (error) {
    console.error('Error marking email as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark email as read',
      error: error.message 
    });
  }
});

// Get email statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    const [inboxCount, outboxCount, unreadCount] = await Promise.all([
      EmailLog.countDocuments({ 'recipients.email': email }),
      EmailLog.countDocuments({ 'sender.email': email }),
      EmailLog.countDocuments({ 
        'recipients.email': email, 
        'recipients.status': { $ne: 'delivered' }
      })
    ]);

    res.json({
      success: true,
      stats: {
        inbox: inboxCount,
        outbox: outboxCount,
        unread: unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch email statistics',
      error: error.message 
    });
  }
});

export default router;