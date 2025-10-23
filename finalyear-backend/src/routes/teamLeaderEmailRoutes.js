import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { teamLeadOnly } from '../middleware/roleAuth.js';
import gmailService from '../services/gmailService.js';
import Email from '../models/Email.js';
import EmailLog from '../models/EmailLog.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication and authorization middlewares to all routes
router.use(authMiddleware);
router.use(teamLeadOnly);

// Test email service connection
router.get('/test-connection', async (req, res) => {
  try {
    await TeamLeaderEmailService.initialize(req.user.id);
    res.json({ 
      success: true,
      message: 'Email service connection successful',
      status: 'connected',
      service: 'smtp',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Email connection test failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Email service connection failed',
      error: error.message,
      status: 'disconnected'
    });
  }
});

// Get inbox emails
router.get('/inbox', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', senderRole = '', startDate = '', endDate = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build query conditions
    const query = {
      'recipients.email': req.user.email,
      isDeleted: false,
    };

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { 'content.text': { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } },
        { 'sender.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      if (status === 'read') {
        query['recipients.readAt'] = { $ne: null };
      } else if (status === 'unread') {
        query['recipients.readAt'] = null;
      }
    }

    if (senderRole) {
      query['sender.role'] = senderRole;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total count for pagination
    const total = await Email.countDocuments(query);

    // Get emails with pagination
    const emails = await Email.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formattedEmails = emails.map(email => ({
      _id: email._id,
      subject: email.subject,
      sender: email.sender,
      recipients: email.recipients,
      content: email.content,
      attachments: email.attachments || [],
      priority: email.priority || 'normal',
      status: email.status,
      isRead: email.recipients.find(r => r.email === req.user.email)?.readAt !== null,
      isArchived: email.isArchived || false,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt
    }));

    res.json({
      success: true,
      data: formattedEmails,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch inbox',
      error: error.message 
    });
  }
});

// Get mailbox statistics
router.get('/stats', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    // Get stats using aggregation pipeline
    const stats = await Email.aggregate([
      {
        $match: {
          $or: [
            { 'sender.email': req.user.email },
            { 'recipients.email': req.user.email }
          ],
          isDeleted: { $ne: true }
        }
      },
      {
        $facet: {
          inbox: [
            {
              $match: {
                'recipients.email': req.user.email,
                isArchived: { $ne: true }
              }
            },
            { $count: 'count' }
          ],
          outbox: [
            {
              $match: {
                'sender.email': req.user.email,
                isArchived: { $ne: true }
              }
            },
            { $count: 'count' }
          ],
          archived: [
            {
              $match: { isArchived: true }
            },
            { $count: 'count' }
          ],
          failed: [
            {
              $match: { status: 'failed' }
            },
            { $count: 'count' }
          ],
          unread: [
            {
              $match: {
                'recipients.email': req.user.email,
                'recipients.readAt': null,
                isArchived: { $ne: true }
              }
            },
            { $count: 'count' }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ]);

    // Format stats for response
    const formatCount = (array) => (array[0]?.count || 0);
    const result = stats[0];

    res.json({
      success: true,
      data: {
        inbox: formatCount(result.inbox),
        outbox: formatCount(result.outbox),
        archived: formatCount(result.archived),
        failed: formatCount(result.failed),
        unread: formatCount(result.unread),
        total: formatCount(result.total)
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching email statistics',
      error: error.message 
    });
  }
});

// Get outbox emails
router.get('/outbox', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', startDate = '', endDate = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build query conditions
    const query = {
      'sender.email': req.user.email,
      isDeleted: false
    };

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { 'content.text': { $regex: search, $options: 'i' } },
        { 'recipients.name': { $regex: search, $options: 'i' } },
        { 'recipients.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total count for pagination
    const total = await Email.countDocuments(query);

    // Get emails with pagination
    const emails = await Email.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formattedEmails = emails.map(email => ({
      _id: email._id,
      subject: email.subject,
      sender: email.sender,
      recipients: email.recipients,
      content: email.content,
      attachments: email.attachments || [],
      priority: email.priority || 'normal',
      status: email.status,
      deliveryStatus: email.deliveryStatus || [],
      isArchived: email.isArchived || false,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt
    }));

    res.json({
      success: true,
      data: formattedEmails,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching outbox:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch outbox',
      error: error.message 
    });
  }
});

// Get archived emails
router.get('/archived', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', startDate = '', endDate = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build query conditions
    const query = {
      $or: [
        { 'sender.email': req.user.email },
        { 'recipients.email': req.user.email }
      ],
      isArchived: true,
      isDeleted: false
    };

    if (search) {
      query.$and = [{
        $or: [
          { subject: { $regex: search, $options: 'i' } },
          { 'content.text': { $regex: search, $options: 'i' } },
          { 'sender.name': { $regex: search, $options: 'i' } },
          { 'sender.email': { $regex: search, $options: 'i' } },
          { 'recipients.name': { $regex: search, $options: 'i' } },
          { 'recipients.email': { $regex: search, $options: 'i' } }
        ]
      }];
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total count for pagination
    const total = await Email.countDocuments(query);

    // Get emails with pagination
    const emails = await Email.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formattedEmails = emails.map(email => ({
      _id: email._id,
      subject: email.subject,
      sender: email.sender,
      recipients: email.recipients,
      content: email.content,
      attachments: email.attachments || [],
      priority: email.priority || 'normal',
      status: email.status,
      isRead: email.recipients.find(r => r.email === req.user.email)?.readAt !== null,
      createdAt: email.createdAt,
      archivedAt: email.archivedAt,
      updatedAt: email.updatedAt
    }));

    res.json({
      success: true,
      data: formattedEmails,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching archived emails:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch archived emails',
      error: error.message 
    });
  }
});

// Mark email as read/unread
router.patch('/:emailId/read-status', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    const { emailId } = req.params;
    const { isRead } = req.body;

    if (typeof isRead !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isRead parameter must be a boolean'
      });
    }

    const email = await Email.findOne({
      _id: emailId,
      'recipients.email': req.user.email,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Update readAt timestamp for the specific recipient
    const recipientIndex = email.recipients.findIndex(r => r.email === req.user.email);
    if (recipientIndex > -1) {
      email.recipients[recipientIndex].readAt = isRead ? new Date() : null;
      await email.save();
    }

    res.json({
      success: true,
      message: `Email marked as ${isRead ? 'read' : 'unread'}`,
      data: {
        emailId,
        isRead,
        readAt: email.recipients[recipientIndex].readAt
      }
    });
  } catch (error) {
    console.error('Error updating read status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update read status',
      error: error.message
    });
  }
});

// Archive/unarchive email
router.patch('/:emailId/archive-status', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    const { emailId } = req.params;
    const { isArchived } = req.body;

    if (typeof isArchived !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isArchived parameter must be a boolean'
      });
    }

    const email = await Email.findOneAndUpdate(
      {
        _id: emailId,
        $or: [
          { 'sender.email': req.user.email },
          { 'recipients.email': req.user.email }
        ],
        isDeleted: false
      },
      {
        $set: {
          isArchived,
          archivedAt: isArchived ? new Date() : null
        }
      },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.json({
      success: true,
      message: `Email ${isArchived ? 'archived' : 'unarchived'} successfully`,
      data: {
        emailId,
        isArchived,
        archivedAt: email.archivedAt
      }
    });
  } catch (error) {
    console.error('Error updating archive status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update archive status',
      error: error.message
    });
  }
});

// Get formatted team member list
router.get('/team-member-list', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const members = await User.find({ role: 'team_member' })
      .select('name email department role')
      .lean();

    const formattedMembers = members.map(member => ({
      id: member._id,
      name: member.name,
      email: member.email,
      displayName: `${member.name} <${member.email}>`,
      department: member.department || 'General',
      role: member.role || 'team_member'
    }));

    res.json({
      success: true,
      members: formattedMembers
    });
  } catch (error) {
    console.error('Error fetching team member list:', error);
    res.status(500).json({ message: 'Error fetching team members' });
  }
});

// Get team members (only team_member role for team leads)
router.get('/team-members',
  authMiddleware,
  teamLeadOnly,
  async (req, res) => {
    try {
      const User = (await import('../models/User.js')).default;
      const users = await User.find({
        role: 'team_member'  // Team leads manage only team members
      }).select('name email role');

      const teamMembers = users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role
      }));

      res.json({
        teamMembers,
        totalMembers: teamMembers.length
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Send team update
router.post('/send-team-update',
  authMiddleware,
  teamLeadOnly,
  async (req, res) => {
    try {
      const { subject, message, priority } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          message: 'Subject and message are required'
        });
      }

      // Get team lead info
      const User = (await import('../models/User.js')).default;
      const teamLead = await User.findById(req.user.id).select('name email');
      
      // Get team members with full details
      const teamMembers = await User.find({ 
        role: 'team_member' 
      }).select('email name role department').lean();
      
      if (teamMembers.length === 0) {
        return res.status(400).json({
          message: 'No team members found'
        });
      }

      // Create email content
      const htmlBody = createTeamUpdateTemplate({
        subject,
        message,
        priority,
        teamLeadName: teamLead.name,
        teamLeadEmail: teamLead.email
      });

      // Create a single email log for all recipients
      const emailLog = new EmailLog({
        type: 'team_update',
        subject: `[Team Update] ${subject}`,
        recipients: teamMembers.map(member => ({
          email: member.email,
          name: member.name || member.email.split('@')[0],
          displayName: `${member.name || member.email.split('@')[0]} <${member.email}>`,
          department: member.department || 'General',
          role: member.role || 'team_member',
          status: 'pending',
          sentAt: new Date(),
          readAt: null
        })),
        content: {
          text: message || '',
          html: htmlBody || '',
          plainText: message?.replace(/\n/g, ' ').trim() || ''
        },
        priority: priority || 'normal',
        sender: {
          email: teamLead.email,
          name: teamLead.name,
          role: 'team_lead',
          displayName: `${teamLead.name} <${teamLead.email}>`
        },
        metadata: {
          sentAt: new Date(),
          updatedAt: new Date(),
          type: 'team_update',
          priority: priority || 'normal',
          recipientCount: teamMembers.length
        },
        status: 'active',
        readBy: []
      });

      // Save the email log first
      await emailLog.save();

      const results = [];
      for (const member of teamMembers) {
        const mailOptions = {
          from: `"${teamLead.name} (Team Lead)" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: member.email,
          subject: `[Team Update] ${subject}`,
          html: htmlBody,
          priority: priority === 'high' ? 'high' : 'normal',
          headers: {
            'X-Email-Type': 'team-update',
            'X-Email-Log-Id': emailLog._id.toString()
          }
        };

        try {
          // Use SMTP service to send
          const transporter = await SMTPEmailService.transporter || await SMTPEmailService.initialize().then(() => SMTPEmailService.transporter);
          const result = await transporter.sendMail(mailOptions);

          // Update recipient status in the email log
          await EmailLog.updateOne(
            { 
              _id: emailLog._id,
              'recipients.email': member.email 
            },
            {
              $set: {
                'recipients.$.status': 'sent',
                'recipients.$.messageId': result.messageId
              }
            }
          );
          
          results.push({ 
            email: member.email, 
            name: member.name, 
            messageId: result.messageId, 
            status: 'sent',
            logId: emailLog._id
          });
          console.log(`✅ Team update sent to ${member.email}`);
        } catch (emailError) {
          // Update recipient status as failed in the email log
          await EmailLog.updateOne(
            { 
              _id: emailLog._id,
              'recipients.email': member.email 
            },
            {
              $set: {
                'recipients.$.status': 'failed',
                'recipients.$.error': emailError.message
              }
            }
          );

          console.error(`❌ Failed to send to ${member.email}:`, emailError.message);
          results.push({ 
            email: member.email, 
            name: member.name, 
            status: 'failed', 
            error: emailError.message 
          });
        }
      }

      // Update final status in email log
      const successCount = results.filter(r => r.status === 'sent').length;
      await EmailLog.updateOne(
        { _id: emailLog._id },
        {
          $set: {
            'metadata.successCount': successCount,
            'metadata.failureCount': teamMembers.length - successCount,
            status: successCount > 0 ? 'active' : 'failed'
          }
        }
      );
      
      res.json({
        message: `Team update sent to ${successCount} out of ${teamMembers.length} team members`,
        emailsSent: successCount,
        emailLogId: emailLog._id,
        results
      });
    } catch (error) {
      console.error('Error sending team update:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Send metrics reminder
router.post('/send-metrics-reminder',
  authMiddleware,
  teamLeadOnly,
  async (req, res) => {
    try {
      const { targetDate, selectedMembers } = req.body;

      if (!targetDate || !selectedMembers || !Array.isArray(selectedMembers)) {
        return res.status(400).json({
          message: 'Target date and selected members array are required'
        });
      }

      if (selectedMembers.length === 0) {
        return res.status(400).json({
          message: 'Please select at least one team member'
        });
      }

      // Get team lead info
      const User = (await import('../models/User.js')).default;
      const teamLead = await User.findById(req.user.id).select('name email');

      // Create a single email log for the reminder
      const emailLog = new EmailLog({
        type: 'metrics_reminder',
        subject: `[Reminder] Metrics Submission - ${targetDate}`,
        recipients: selectedMembers.map(member => ({
          email: member.email,
          name: member.name,
          displayName: `${member.name} <${member.email}>`,
          department: member.department || 'General',
          role: 'team_member',
          status: 'pending',
          sentAt: new Date(),
          readAt: null
        })),
        content: {
          text: `Metrics submission reminder for ${targetDate}`,
          html: '', // Will be set individually for each member
          plainText: `Metrics submission reminder for ${targetDate}`
        },
        priority: 'high',
        sender: {
          email: teamLead.email,
          name: teamLead.name,
          role: 'team_lead',
          displayName: `${teamLead.name} <${teamLead.email}>`
        },
        metadata: {
          sentAt: new Date(),
          updatedAt: new Date(),
          type: 'metrics_reminder',
          targetDate: targetDate,
          recipientCount: selectedMembers.length
        },
        status: 'active',
        readBy: []
      });

      // Save the email log first
      await emailLog.save();

      const results = [];
      for (const member of selectedMembers) {
        const htmlBody = createMetricsReminderTemplate({
          targetDate,
          memberName: member.name,
          teamLeadName: teamLead.name,
          teamLeadEmail: teamLead.email
        });

        const mailOptions = {
          from: `"${teamLead.name} (Team Lead)" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: member.email,
          subject: `[Reminder] Metrics Submission - ${targetDate}`,
          html: htmlBody,
          priority: 'high',
          headers: {
            'X-Email-Type': 'metrics-reminder',
            'X-Email-Log-Id': emailLog._id.toString()
          }
        };

        try {
          const transporter = await SMTPEmailService.transporter || await SMTPEmailService.initialize().then(() => SMTPEmailService.transporter);
          const result = await transporter.sendMail(mailOptions);

          // Update recipient status and content in email log
          await EmailLog.updateOne(
            { 
              _id: emailLog._id,
              'recipients.email': member.email 
            },
            {
              $set: {
                'recipients.$.status': 'sent',
                'recipients.$.messageId': result.messageId,
                'recipients.$.sentAt': new Date(),
                'content.html': htmlBody // Store the personalized HTML content
              }
            }
          );

          results.push({ 
            email: member.email, 
            name: member.name, 
            messageId: result.messageId, 
            status: 'sent',
            logId: emailLog._id
          });
          console.log(`📋 Metrics reminder sent to ${member.email}`);
        } catch (emailError) {
          // Update recipient status as failed in email log
          await EmailLog.updateOne(
            { 
              _id: emailLog._id,
              'recipients.email': member.email 
            },
            {
              $set: {
                'recipients.$.status': 'failed',
                'recipients.$.error': emailError.message
              }
            }
          );

          console.error(`❌ Failed to send reminder to ${member.email}:`, emailError.message);
          results.push({ 
            email: member.email, 
            name: member.name, 
            status: 'failed', 
            error: emailError.message 
          });
        }
      }

      // Update final status in email log
      const successCount = results.filter(r => r.status === 'sent').length;
      await EmailLog.updateOne(
        { _id: emailLog._id },
        {
          $set: {
            'metadata.successCount': successCount,
            'metadata.failureCount': selectedMembers.length - successCount,
            status: successCount > 0 ? 'active' : 'failed'
          }
        }
      );

      res.json({
        message: `Metrics reminders sent to ${successCount} out of ${selectedMembers.length} team members`,
        emailLogId: emailLog._id,
        results
      });
    } catch (error) {
      console.error('Error sending metrics reminder:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Send team alert
router.post('/send-team-alert',
  authMiddleware,
  teamLeadOnly,
  async (req, res) => {
    try {
      const { subject, message, priority } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          message: 'Subject and message are required'
        });
      }

      // Get team lead info
      const User = (await import('../models/User.js')).default;
      const teamLead = await User.findById(req.user.id).select('name email');
      
      // Get team members
      const teamMembers = await User.find({ role: 'team_member' }).select('email name department role');
      
      if (teamMembers.length === 0) {
        return res.status(400).json({
          message: 'No team members found'
        });
      }

      const priorityPrefix = priority === 'high' ? '🚨 [URGENT]' : priority === 'medium' ? '⚠️ [IMPORTANT]' : '📢';
      
      // Create a single email log for the alert
      const emailLog = new EmailLog({
        type: 'team_alert',
        subject: `${priorityPrefix} ${subject}`,
        recipients: teamMembers.map(member => ({
          email: member.email,
          name: member.name || member.email.split('@')[0],
          displayName: `${member.name || member.email.split('@')[0]} <${member.email}>`,
          department: member.department || 'General',
          role: member.role || 'team_member',
          status: 'pending',
          sentAt: new Date(),
          readAt: null
        })),
        content: {
          text: message || '',
          html: '', // Will be set after creating the template
          plainText: message?.replace(/\n/g, ' ').trim() || ''
        },
        priority: priority || 'normal',
        sender: {
          email: teamLead.email,
          name: teamLead.name,
          role: 'team_lead',
          displayName: `${teamLead.name} <${teamLead.email}>`
        },
        metadata: {
          sentAt: new Date(),
          updatedAt: new Date(),
          type: 'team_alert',
          priority: priority || 'normal',
          recipientCount: teamMembers.length
        },
        status: 'active',
        readBy: []
      });

      // Save the email log first
      await emailLog.save();

      const results = [];
      const htmlBody = createTeamAlertTemplate({
        subject,
        message,
        priority,
        teamLeadName: teamLead.name,
        teamLeadEmail: teamLead.email
      });

      // Update the HTML content in the email log
      await EmailLog.updateOne(
        { _id: emailLog._id },
        { $set: { 'content.html': htmlBody } }
      );

      for (const member of teamMembers) {
        const mailOptions = {
          from: `"${teamLead.name} (Team Lead)" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: member.email,
          subject: `${priorityPrefix} ${subject}`,
          html: htmlBody,
          priority: priority === 'high' ? 'high' : 'normal',
          headers: {
            'X-Email-Type': 'team-alert',
            'X-Email-Log-Id': emailLog._id.toString(),
            'X-Priority': priority || 'normal'
          }
        };

        try {
          const transporter = await SMTPEmailService.transporter || await SMTPEmailService.initialize().then(() => SMTPEmailService.transporter);
          const result = await transporter.sendMail(mailOptions);

          // Update recipient status in the email log
          await EmailLog.updateOne(
            { 
              _id: emailLog._id,
              'recipients.email': member.email 
            },
            {
              $set: {
                'recipients.$.status': 'sent',
                'recipients.$.messageId': result.messageId,
                'recipients.$.sentAt': new Date()
              }
            }
          );
          
          results.push({ 
            email: member.email, 
            name: member.name, 
            messageId: result.messageId, 
            status: 'sent',
            logId: emailLog._id
          });
          console.log(`🚨 Team alert sent to ${member.email}`);
        } catch (emailError) {
          // Update recipient status as failed in the email log
          await EmailLog.updateOne(
            { 
              _id: emailLog._id,
              'recipients.email': member.email 
            },
            {
              $set: {
                'recipients.$.status': 'failed',
                'recipients.$.error': emailError.message
              }
            }
          );

          console.error(`❌ Failed to send alert to ${member.email}:`, emailError.message);
          results.push({ 
            email: member.email, 
            name: member.name, 
            status: 'failed', 
            error: emailError.message 
          });
        }
      }

      // Update final status in email log
      const successCount = results.filter(r => r.status === 'sent').length;
      await EmailLog.updateOne(
        { _id: emailLog._id },
        {
          $set: {
            'metadata.successCount': successCount,
            'metadata.failureCount': teamMembers.length - successCount,
            status: successCount > 0 ? 'active' : 'failed'
          }
        }
      );

      res.json({
        message: `Team alert sent to ${successCount} out of ${teamMembers.length} team members`,
        emailLogId: emailLog._id,
        results
      });
    } catch (error) {
      console.error('Error sending team alert:', error);
      res.status(500).json({ message: error.message });
    }
  }
);



// Email template functions
function createTeamUpdateTemplate({ subject, message, priority, teamLeadName, teamLeadEmail }) {
  const priorityColor = priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#2196f3';
  const priorityIcon = priority === 'high' ? '⚠️' : priority === 'medium' ? '📋' : '📢';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${priorityColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${priorityIcon} Team Update</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">From: ${teamLeadName}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid ${priorityColor};">
          <h2 style="margin: 0 0 15px 0; color: #2c3e50;">${subject}</h2>
          <div style="line-height: 1.6; color: #333;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>

        <div style="text-align: center; padding: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>${teamLeadName}</strong> (Team Lead)<br>
            📧 ${teamLeadEmail}
          </p>
        </div>
      </div>
    </div>
  `;
}

function createMetricsReminderTemplate({ targetDate, memberName, teamLeadName, teamLeadEmail }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">📋 Metrics Submission Reminder</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">From: ${teamLeadName}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 6px;">
          <h2 style="margin: 0 0 15px 0; color: #2c3e50;">Hi ${memberName}! 👋</h2>
          
          <p style="color: #333; line-height: 1.6;">
            This is a friendly reminder that your daily metrics for <strong>${targetDate}</strong> need to be submitted. 
            Please take a moment to update your performance metrics in the dashboard.
          </p>

          <div style="background: #fff8e1; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 10px 0; color: #e65100;">📊 Required Metrics</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li>Tickets Assigned</li>
              <li>Tickets Resolved</li>
              <li>SLA Breaches</li>
              <li>Reopened Tickets</li>
              <li>Client Interactions</li>
              <li>Remarks (optional)</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              📈 Submit Metrics Now
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Thanks for your cooperation!<br>
            <strong>${teamLeadName}</strong> (Team Lead)<br>
            📧 ${teamLeadEmail}
          </p>
        </div>
      </div>
    </div>
  `;
}

function createTeamAlertTemplate({ subject, message, priority, teamLeadName, teamLeadEmail }) {
  const priorityColor = priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#2196f3';
  const priorityIcon = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : '📢';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${priorityColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${priorityIcon} TEAM ALERT</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">From: ${teamLeadName}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid ${priorityColor};">
          <h2 style="margin: 0 0 15px 0; color: #2c3e50;">${subject}</h2>
          <div style="line-height: 1.6; color: #333;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>

        ${priority === 'high' ? `
        <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin-top: 15px; text-align: center;">
          <p style="margin: 0; color: #c62828; font-weight: bold;">
            ⚡ This message requires immediate attention
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; padding: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Sent: ${new Date().toLocaleString()}<br>
            <strong>${teamLeadName}</strong> (Team Lead)<br>
            📧 ${teamLeadEmail}
          </p>
        </div>
      </div>
    </div>
  `;
}

// Get email by ID
router.get('/:emailId', authMiddleware, teamLeadOnly, async (req, res) => {
  try {
    const { emailId } = req.params;
    
    // Skip if the emailId is "team-members" as it's handled by another route
    if (emailId === 'team-members') {
      return next();
    }

    const email = await Email.findOne({
      _id: emailId,
      $or: [
        { 'sender.email': req.user.email },
        { 'recipients.email': req.user.email }
      ],
      isDeleted: false
    }).lean();

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // If user is a recipient and hasn't read the email yet, mark it as read
    if (email.recipients.some(r => r.email === req.user.email && !r.readAt)) {
      await Email.updateOne(
        { 
          _id: emailId,
          'recipients.email': req.user.email 
        },
        {
          $set: {
            'recipients.$.readAt': new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      data: {
        _id: email._id,
        subject: email.subject,
        sender: email.sender,
        recipients: email.recipients,
        content: email.content,
        attachments: email.attachments || [],
        priority: email.priority || 'normal',
        status: email.status,
        isRead: email.recipients.find(r => r.email === req.user.email)?.readAt !== null,
        isArchived: email.isArchived || false,
        createdAt: email.createdAt,
        updatedAt: email.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email',
      error: error.message
    });
  }
});

export default router;