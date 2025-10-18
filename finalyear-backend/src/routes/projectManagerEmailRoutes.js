import express from 'express';
import { authMiddleware, authorizeRoles } from '../middleware/auth.js';
import ProjectManagerEmailService from '../services/projectManagerEmailService.js';
import SMTPEmailService from '../services/smtpEmailService.js';
import { getAllTeamMetricsData } from '../services/userSheetsService.js';

const router = express.Router();

// Middleware to ensure only project managers can access these routes
const projectManagerOnly = (req, res, next) => {
  if (
    req.user.role !== 'project_manager' &&
    req.user.role !== 'team_lead' &&
    req.user.role !== 'team_member'
  ) {
    return res.status(403).json({ 
      message: 'Access denied: Project Manager, Team Lead, or Team Member routes only' 
    });
  }
  next();
};

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
        result = await ProjectManagerEmailService.sendTeamPerformanceReport(teamMetricsData);
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await SMTPEmailService.sendTeamPerformanceReport(teamMetricsData);
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
        result = await ProjectManagerEmailService.sendIndividualFeedback({
          recipientEmail,
          recipientName,
          performanceData: performanceData || {},
          feedback
        });
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await SMTPEmailService.sendIndividualFeedback({
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
      const { subject, message, priority, recipients } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          message: 'Subject and message are required'
        });
      }

      // Try Gmail API first, fallback to SMTP
      let result;
      try {
        result = await ProjectManagerEmailService.sendUrgentAlert({
          subject,
          message,
          priority: priority || 'high',
          recipients: recipients || 'all'
        });
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await SMTPEmailService.sendUrgentAlert({
          subject,
          message,
          priority: priority || 'high',
          recipients: recipients || 'all'
        });
      }

      res.json({
        message: 'Urgent alert sent successfully',
        results: result.results
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
        result = await ProjectManagerEmailService.sendMetricsReminder({
          targetDate,
          missingSubmissions
        });
      } catch (gmailError) {
        console.log('Gmail API failed, trying SMTP...', gmailError.message);
        result = await SMTPEmailService.sendMetricsReminder({
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
        analytics = await ProjectManagerEmailService.getEmailAnalytics();
      } catch (gmailError) {
        console.log('Gmail analytics failed, using SMTP analytics...', gmailError.message);
        analytics = await SMTPEmailService.getEmailAnalytics();
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

// Test email service connection
router.get('/test-connection',
  authMiddleware,
  projectManagerOnly,
  async (req, res) => {
    try {
      // Try Gmail service first, fallback to SMTP
      let service = 'gmail';
      let error = null;
      
      try {
        await ProjectManagerEmailService.initialize();
        console.log('✅ Gmail API service connected');
      } catch (gmailError) {
        console.log('❌ Gmail API failed, trying SMTP...');
        error = gmailError.message;
        
        try {
          await SMTPEmailService.initialize();
          service = 'smtp';
          console.log('✅ SMTP service connected');
        } catch (smtpError) {
          throw new Error(`Both Gmail API and SMTP failed. Gmail: ${gmailError.message}, SMTP: ${smtpError.message}`);
        }
      }
      
      res.json({ 
        message: `Email service connection successful (${service.toUpperCase()})`,
        status: 'connected',
        service: service,
        timestamp: new Date().toISOString(),
        fallbackUsed: service === 'smtp',
        gmailError: error
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Email service connection failed',
        error: error.message,
        status: 'disconnected'
      });
    }
  }
);

export default router;