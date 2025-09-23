import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

class SMTPEmailService {
  constructor() {
    this.transporter = null;
  }

  async initialize() {
    try {
      // Configure SMTP transporter
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER || 'dhaanushk1110@gmail.com', // Your Gmail
          pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD // App Password
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ SMTP Email service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize SMTP service:', error);
      throw error;
    }
  }

  async sendTeamPerformanceReport(teamMetricsData) {
    try {
      if (!this.transporter) await this.initialize();

      // Fetch team emails from database
      const teamUsers = await User.find({
        role: { $in: ['team_member', 'team_lead'] }
      }).select('email name');

      if (teamUsers.length === 0) {
        throw new Error('No team members found in database');
      }

      const htmlBody = this.createTeamPerformanceTemplate(teamMetricsData);
      
      const results = [];
      for (const user of teamUsers) {
        const mailOptions = {
          from: `"Project Manager" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: user.email,
          subject: `[PM] Weekly Team Performance Report - ${new Date().toDateString()}`,
          html: htmlBody
        };

        const result = await this.transporter.sendMail(mailOptions);
        results.push({ email: user.email, messageId: result.messageId });
        console.log(`✅ Performance report sent to ${user.email}`);
      }

      return { success: true, emailsSent: teamUsers.length, results };
    } catch (error) {
      console.error('❌ Failed to send team performance report:', error);
      throw error;
    }
  }

  async sendIndividualFeedback({ recipientEmail, recipientName, performanceData, feedback }) {
    try {
      if (!this.transporter) await this.initialize();

      const htmlBody = this.createIndividualFeedbackTemplate({
        recipientName,
        performanceData,
        feedback
      });

      const mailOptions = {
        from: `"Project Manager" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
        to: recipientEmail,
        subject: `[PM] Performance Feedback - ${recipientName}`,
        html: htmlBody
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Individual feedback sent to ${recipientEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send individual feedback:', error);
      throw error;
    }
  }

  async sendUrgentAlert({ subject, message, priority = 'high', recipients = 'all' }) {
    try {
      if (!this.transporter) await this.initialize();

      let emailList = [];
      if (recipients === 'all') {
        const teamUsers = await User.find({
          role: { $in: ['team_member', 'team_lead'] }
        }).select('email');
        emailList = teamUsers.map(user => user.email);
      } else {
        emailList = Array.isArray(recipients) ? recipients : [recipients];
      }

      if (emailList.length === 0) {
        throw new Error('No recipients found');
      }

      const htmlBody = this.createUrgentAlertTemplate({ subject, message, priority });

      const results = [];
      for (const email of emailList) {
        const mailOptions = {
          from: `"Project Manager" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: email,
          subject: `🚨 [PM URGENT] ${subject}`,
          html: htmlBody,
          priority: priority === 'high' ? 'high' : 'normal'
        };

        const result = await this.transporter.sendMail(mailOptions);
        results.push({ email, messageId: result.messageId });
        console.log(`🚨 Urgent alert sent to ${email}`);
      }

      return { success: true, results };
    } catch (error) {
      console.error('❌ Failed to send urgent alert:', error);
      throw error;
    }
  }

  async sendMetricsReminder({ targetDate, missingSubmissions }) {
    try {
      if (!this.transporter) await this.initialize();

      const results = [];
      for (const submission of missingSubmissions) {
        const htmlBody = this.createMetricsReminderTemplate({
          targetDate,
          userName: submission.name
        });

        const mailOptions = {
          from: `"Project Manager" <${process.env.EMAIL_USER || 'dhaanushk1110@gmail.com'}>`,
          to: submission.email,
          subject: `[PM] Metrics Submission Reminder - ${targetDate}`,
          html: htmlBody
        };

        const result = await this.transporter.sendMail(mailOptions);
        results.push({ 
          email: submission.email, 
          name: submission.name,
          messageId: result.messageId 
        });

        console.log(`📋 Metrics reminder sent to ${submission.email}`);
      }

      return { success: true, results };
    } catch (error) {
      console.error('❌ Failed to send metrics reminder:', error);
      throw error;
    }
  }

  async getEmailAnalytics() {
    // For SMTP, we can't get sent email analytics like with Gmail API
    // Return mock analytics or implement with a logging system
    return {
      totalSent: 0,
      recentMessages: [],
      analytics: {
        alerts: 0,
        reports: 0,
        feedback: 0,
        reminders: 0,
        other: 0
      }
    };
  }

  // Email Templates (same as Gmail version)
  createTeamPerformanceTemplate(teamMetricsData) {
    const { aggregatedKPIs, individualKPIs, reportPeriod } = teamMetricsData;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📊 Team Performance Report</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Period: ${reportPeriod || 'This Week'} | Generated: ${new Date().toLocaleDateString()}
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <!-- Overall Team Performance -->
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0;">🎯 Overall Team Performance</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 6px;">
                <h3 style="margin: 0; color: #28a745; font-size: 24px;">${aggregatedKPIs.totalTasks}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Total Tasks</p>
              </div>
              <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 6px;">
                <h3 style="margin: 0; color: #2196f3; font-size: 24px;">${aggregatedKPIs.completedTasks}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Completed</p>
              </div>
              <div style="text-align: center; padding: 15px; background: #fff3e0; border-radius: 6px;">
                <h3 style="margin: 0; color: #ff9800; font-size: 24px;">${aggregatedKPIs.pendingTasks}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Pending</p>
              </div>
              <div style="text-align: center; padding: 15px; background: #ffebee; border-radius: 6px;">
                <h3 style="margin: 0; color: #f44336; font-size: 24px;">${aggregatedKPIs.lateTasks}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">SLA Breaches</p>
              </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <div style="background: #4caf50; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block;">
                <strong>Team Completion Rate: ${aggregatedKPIs.completionRate}%</strong>
              </div>
            </div>
          </div>

          <!-- Individual Performance -->
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0;">👥 Individual Performance</h2>
            ${Object.entries(individualKPIs).map(([name, kpis]) => `
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center;">
                  <span style="width: 12px; height: 12px; background: ${kpis.completionRate >= 80 ? '#4caf50' : kpis.completionRate >= 60 ? '#ff9800' : '#f44336'}; border-radius: 50%; margin-right: 10px;"></span>
                  ${name}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                  <div>
                    <strong>Tasks:</strong> ${kpis.totalTasks}<br>
                    <strong>Completed:</strong> ${kpis.completedTasks}
                  </div>
                  <div>
                    <strong>Pending:</strong> ${kpis.pendingTasks}<br>
                    <strong>SLA Breaches:</strong> ${kpis.lateTasks}
                  </div>
                  <div>
                    <strong>Completion Rate:</strong><br>
                    <span style="color: ${kpis.completionRate >= 80 ? '#4caf50' : kpis.completionRate >= 60 ? '#ff9800' : '#f44336'}; font-weight: bold;">${kpis.completionRate}%</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>This report was automatically generated by the Team Performance Dashboard</p>
          <p>📧 Project Manager | Team Metrics System</p>
        </div>
      </div>
    `;
  }

  createIndividualFeedbackTemplate({ recipientName, performanceData, feedback }) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">💬 Performance Feedback</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Personal feedback from Project Manager</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #2c3e50;">Hi ${recipientName}! 👋</h2>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1976d2;">📊 Your Recent Performance</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Completion Rate:</strong> ${performanceData.completionRate || 'N/A'}%</div>
                <div><strong>Tasks Completed:</strong> ${performanceData.completedTasks || 'N/A'}</div>
                <div><strong>SLA Performance:</strong> ${performanceData.slaPerformance || 'N/A'}%</div>
                <div><strong>Client Interactions:</strong> ${performanceData.clientInteractions || 'N/A'}</div>
              </div>
            </div>

            <div style="background: #f1f8e9; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #2e7d32;">💭 Feedback</h3>
              <p style="margin: 0; line-height: 1.6; color: #333;">${feedback}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createUrgentAlertTemplate({ subject, message, priority }) {
    const priorityColor = priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#2196f3';
    const priorityIcon = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : 'ℹ️';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">${priorityIcon} URGENT ALERT</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">From: Project Manager</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid ${priorityColor};">
            <h2 style="margin: 0 0 15px 0; color: #2c3e50;">${subject}</h2>
            <div style="line-height: 1.6; color: #333;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin-top: 15px; text-align: center;">
            <p style="margin: 0; color: #c62828; font-weight: bold;">
              ⚡ This message requires immediate attention
            </p>
          </div>
        </div>
      </div>
    `;
  }

  createMetricsReminderTemplate({ targetDate, userName }) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📋 Metrics Submission Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Daily metrics submission required</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 6px;">
            <h2 style="margin: 0 0 15px 0; color: #2c3e50;">Hi ${userName}! 👋</h2>
            
            <p style="color: #333; line-height: 1.6;">
              We noticed that your daily metrics for <strong>${targetDate}</strong> haven't been submitted yet. 
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
        </div>
      </div>
    `;
  }
}

export default new SMTPEmailService();