import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import SMTPEmailService from '../services/smtpEmailService.js';

const router = express.Router();

// Middleware to ensure only team leads can access these routes
const teamLeadOnly = (req, res, next) => {
  if (req.user.role !== 'team_lead') {
    return res.status(403).json({ 
      message: 'Access denied: Team Lead routes only' 
    });
  }
  next();
};

// Test email service connection
router.get('/test-connection',
  authMiddleware,
  teamLeadOnly,
  async (req, res) => {
    try {
      await SMTPEmailService.initialize();
      res.json({ 
        message: 'Email service connection successful (SMTP)',
        status: 'connected',
        service: 'smtp',
        timestamp: new Date().toISOString()
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
      
      // Get team members
      const teamMembers = await User.find({ role: 'team_member' }).select('email name');
      
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

      const results = [];
      for (const member of teamMembers) {
        const mailOptions = {
          from: `"${teamLead.name} (Team Lead)" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: member.email,
          subject: `[Team Update] ${subject}`,
          html: htmlBody
        };

        try {
          // Use SMTP service to send
          const transporter = await SMTPEmailService.transporter || await SMTPEmailService.initialize().then(() => SMTPEmailService.transporter);
          const result = await transporter.sendMail(mailOptions);
          results.push({ email: member.email, name: member.name, messageId: result.messageId, status: 'sent' });
          console.log(`✅ Team update sent to ${member.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send to ${member.email}:`, emailError.message);
          results.push({ email: member.email, name: member.name, status: 'failed', error: emailError.message });
        }
      }

      const successCount = results.filter(r => r.status === 'sent').length;
      
      res.json({
        message: `Team update sent to ${successCount} out of ${teamMembers.length} team members`,
        emailsSent: successCount,
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
          html: htmlBody
        };

        try {
          const transporter = await SMTPEmailService.transporter || await SMTPEmailService.initialize().then(() => SMTPEmailService.transporter);
          const result = await transporter.sendMail(mailOptions);
          results.push({ email: member.email, name: member.name, messageId: result.messageId, status: 'sent' });
          console.log(`📋 Metrics reminder sent to ${member.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send reminder to ${member.email}:`, emailError.message);
          results.push({ email: member.email, name: member.name, status: 'failed', error: emailError.message });
        }
      }

      const successCount = results.filter(r => r.status === 'sent').length;

      res.json({
        message: `Metrics reminders sent to ${successCount} out of ${selectedMembers.length} team members`,
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
      const teamMembers = await User.find({ role: 'team_member' }).select('email name');
      
      if (teamMembers.length === 0) {
        return res.status(400).json({
          message: 'No team members found'
        });
      }

      const results = [];
      for (const member of teamMembers) {
        const htmlBody = createTeamAlertTemplate({
          subject,
          message,
          priority,
          teamLeadName: teamLead.name,
          teamLeadEmail: teamLead.email
        });

        const priorityPrefix = priority === 'high' ? '🚨 [URGENT]' : priority === 'medium' ? '⚠️ [IMPORTANT]' : '📢';
        
        const mailOptions = {
          from: `"${teamLead.name} (Team Lead)" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: member.email,
          subject: `${priorityPrefix} ${subject}`,
          html: htmlBody,
          priority: priority === 'high' ? 'high' : 'normal'
        };

        try {
          const transporter = await SMTPEmailService.transporter || await SMTPEmailService.initialize().then(() => SMTPEmailService.transporter);
          const result = await transporter.sendMail(mailOptions);
          results.push({ email: member.email, name: member.name, messageId: result.messageId, status: 'sent' });
          console.log(`🚨 Team alert sent to ${member.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send alert to ${member.email}:`, emailError.message);
          results.push({ email: member.email, name: member.name, status: 'failed', error: emailError.message });
        }
      }

      const successCount = results.filter(r => r.status === 'sent').length;

      res.json({
        message: `Team alert sent to ${successCount} out of ${teamMembers.length} team members`,
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

export default router;