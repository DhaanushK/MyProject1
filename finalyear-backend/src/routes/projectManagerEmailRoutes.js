import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { projectManagerOnly } from '../middleware/roleAuth.js';
import nodemailerService from '../services/nodemailerService.js';
import smtpEmailService from '../services/smtpEmailService.js';
import EmailLog from '../models/EmailLog.js';
import User from '../models/User.js';
import { getAllTeamMetricsData } from '../services/userSheetsService.js';

const router = express.Router();

// Send team performance report
router.post('/send-team-report',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      // Get all team metrics data
      const teamData = await getAllTeamMetricsData(process.env.SPREADSHEET_ID);
      
      // Calculate aggregated KPIs
      const calculateKPIs = (data) => {
        let totalTasks = 0;
        let completedTasks = 0;
        let pendingTasks = 0;
        let lateTasks = 0;
        
        for (let i = 0; i < data.length; i++) {
          const d = data[i];
          totalTasks += d.totalTasks;
          completedTasks += d.completed;
          pendingTasks += d.pending;
          lateTasks += d.late;
        }
        
        return {
          totalTasks,
          completedTasks,
          pendingTasks,
          lateTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
      };

      // Extract data from teamData object
      const allMetrics = [];
      const userMetrics = teamData.userMetrics || {};
      
      // Flatten all metrics into single array
      for (const userName in userMetrics) {
        if (Array.isArray(userMetrics[userName])) {
          for (let i = 0; i < userMetrics[userName].length; i++) {
            allMetrics.push(userMetrics[userName][i]);
          }
        }
      }

      const aggregatedKPIs = teamData.aggregatedKPIs || calculateKPIs(allMetrics);

      // Individual KPIs are already calculated in teamData
      const individualKPIs = teamData.individualKPIs || {};

      // If individualKPIs is empty, calculate them
      if (Object.keys(individualKPIs).length === 0) {
        for (const userName in userMetrics) {
          individualKPIs[userName] = calculateKPIs(userMetrics[userName]);
        }
      }

      const teamMetricsData = {
        aggregatedKPIs,
        individualKPIs,
        reportPeriod: req.body.reportPeriod || 'This Week'
      };

      // Try Gmail API first, fallback to SMTP
      let result;
      try {
        result = await nodemailerService.sendTeamPerformanceReport(teamMetricsData);
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await smtpEmailService.sendTeamPerformanceReport(teamMetricsData);
      }

      res.json({
        message: 'Team performance report sent successfully',
        emailsSent: result.emailsSent,
        reportData: teamMetricsData
      });
    } catch (error) {
      console.error('Error sending team report:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Send individual feedback
router.post('/send-individual-feedback',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      const { recipientEmail, recipientName, performanceData, feedback } = req.body;

      if (!recipientEmail || !recipientName || !feedback) {
        return res.status(400).json({
          message: 'Recipient email, name, and feedback are required'
        });
      }

      // Validate that recipient email is in approved list
      const User = (await import('../models/User.js')).default;
      const teamUsers = await User.find({
        role: { $in: ['team_member', 'team_lead'] }
      }).select('email');
      
      const approvedEmails = teamUsers.map(user => user.email);

      if (!approvedEmails.includes(recipientEmail)) {
        return res.status(400).json({
          message: 'Recipient email is not in the approved team member list'
        });
      }

      // Try Gmail API first, fallback to SMTP
      let result;
      try {
        result = await nodemailerService.sendIndividualFeedback({
          recipientEmail,
          recipientName,
          performanceData: performanceData || {},
          feedback
        });
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await smtpEmailService.sendIndividualFeedback({
          recipientEmail,
          recipientName,
          performanceData: performanceData || {},
          feedback
        });
      }

      res.json({
        message: 'Individual feedback sent successfully',
        recipient: recipientEmail,
        messageId: result.messageId || result.id
      });
    } catch (error) {
      console.error('Error sending individual feedback:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Send urgent alert
router.post('/send-urgent-alert',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      const { subject, message, priority = 'high', recipients = 'all' } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          message: 'Subject and message are required'
        });
      }

      // Get recipient list
      let recipientList = [];
      if (recipients === 'all') {
        const teamUsers = await User.find({
          role: { $in: ['team_member', 'team_lead'] }
        }).select('email name');
        recipientList = teamUsers.map(user => user.email);
      } else {
        recipientList = Array.isArray(recipients) ? recipients : [recipients];
      }

      // Send email using nodemailer
      const result = await nodemailerService.sendUrgentAlert({
        subject,
        message,
        priority,
        recipients: recipientList
      });

      // Log the email
      const emailLog = await EmailLog.create({
        type: 'urgent',
        subject,
        recipients: recipientList.map(email => ({
          email,
          status: 'sent',
          sentAt: new Date()
        })),
        content: {
          text: message,
          html: result.html
        },
        priority,
        sender: {
          email: process.env.EMAIL_USER,
          name: 'Project Manager'
        },
        metadata: {
          messageIds: result.results.map(r => r.messageId)
        }
      });

      res.json({
        message: 'Urgent alert sent successfully',
        recipients: recipientList.length,
        emailLog: emailLog._id
      });
    } catch (error) {
      console.error('Error sending urgent alert:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Send metrics submission reminder
router.post('/send-metrics-reminder',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      const { targetDate, missingSubmissions } = req.body;

      if (!targetDate || !missingSubmissions || !Array.isArray(missingSubmissions)) {
        return res.status(400).json({
          message: 'Target date and missing submissions array are required'
        });
      }

      // Try Gmail API first, fallback to SMTP
      let result;
      try {
        result = await nodemailerService.sendMetricsReminder({
          targetDate,
          missingSubmissions
        });
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await smtpEmailService.sendMetricsReminder({
          targetDate,
          missingSubmissions
        });
      }

      res.json({
        message: 'Metrics reminders sent successfully',
        results: result.results
      });
    } catch (error) {
      console.error('Error sending metrics reminder:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get email analytics
router.get('/email-analytics',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      // Try Gmail API first, fallback to SMTP
      let analytics;
      try {
        analytics = await nodemailerService.getEmailAnalytics();
      } catch (gmailError) {
        console.log('Gmail analytics failed, using SMTP analytics...', gmailError.message);
        analytics = await smtpEmailService.getEmailAnalytics();
      }
      res.json(analytics);
    } catch (error) {
      console.error('Error getting email analytics:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get team member list for email recipients
router.get('/team-members',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      // Fetch actual users from database
      const User = (await import('../models/User.js')).default;
      const users = await User.find({
        role: { $in: ['team_member', 'team_lead'] }
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

// Get inbox emails
router.get('/inbox',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    console.log('Inbox route hit with query:', req.query);
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ message: 'Email parameter is required' });
      }

      const messages = await EmailLog.find({
        'recipients.email': email
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.json({ 
        success: true,
        messages: messages.map(msg => ({
          _id: msg._id,
          from: msg.sender.email,
          fromName: msg.sender.name,
          to: msg.recipients.map(r => r.email),
          toNames: msg.recipients.map(r => r.name),
          subject: msg.subject,
          text: msg.content.text || '',
          html: msg.content.html || '',
          type: msg.type,
          priority: msg.priority || 'normal',
          status: msg.status,
          createdAt: msg.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching inbox:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch inbox',
        error: error.message 
      });
    }
  }
);

// Get outbox emails
router.get('/outbox',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    console.log('Outbox route hit with query:', req.query);
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ message: 'Email parameter is required' });
      }

      const messages = await EmailLog.find({
        'sender.email': email
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.json({ 
        success: true,
        messages: messages.map(msg => ({
          _id: msg._id,
          from: msg.sender.email,
          fromName: msg.sender.name,
          to: msg.recipients.map(r => r.email),
          toNames: msg.recipients.map(r => r.name),
          subject: msg.subject,
          text: msg.content.text || '',
          html: msg.content.html || '',
          type: msg.type,
          priority: msg.priority || 'normal',
          status: msg.status,
          createdAt: msg.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching outbox:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch outbox',
        error: error.message 
      });
    }
  }
);

// Test email service connection
router.get('/test-connection',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      await nodemailerService.initialize();
      res.json({ 
        message: 'Email service connection successful',
        status: 'connected',
        service: 'gmail-smtp',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email connection test failed:', error);
      res.status(500).json({ 
        message: 'Email service connection failed',
        error: error.message,
        status: 'disconnected'
      });
    }
  }
);

export default router;