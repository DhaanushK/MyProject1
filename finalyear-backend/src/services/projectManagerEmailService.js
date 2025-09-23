import { google } from 'googleapis';
import { getGoogleAuth } from './googleAuth.js';
import User from '../models/User.js';

class ProjectManagerEmailService {
  constructor() {
    this.gmail = null;
  }

  async initialize() {
    try {
      const auth = await getGoogleAuth();
      this.gmail = google.gmail({ version: 'v1', auth });
      console.log('✅ Project Manager Gmail service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gmail service:', error);
      throw error;
    }
  }

  // Send team performance report to all team members
  async sendTeamPerformanceReport(teamMetricsData) {
    try {
      if (!this.gmail) await this.initialize();

      // Fetch team emails from database
      const teamUsers = await User.find({
        role: { $in: ['team_member', 'team_lead'] }
      }).select('email');

      const teamEmails = teamUsers.map(user => user.email);

      if (teamEmails.length === 0) {
        throw new Error('No team members found in database');
      }

      const htmlBody = this.createTeamPerformanceTemplate(teamMetricsData);
      
      for (const email of teamEmails) {
        const message = this.createMessage({
          to: email,
          subject: `[PM] Weekly Team Performance Report - ${new Date().toDateString()}`,
          htmlBody
        });

        const result = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: message }
        });

        console.log(`✅ Performance report sent to ${email}, Message ID: ${result.data.id}`);
      }

      // Log activity
      await this.logPMActivity({
        type: 'team_performance_report',
        recipients: teamEmails,
        timestamp: new Date().toISOString()
      });

      return { success: true, emailsSent: teamEmails.length };
    } catch (error) {
      console.error('❌ Failed to send team performance report:', error);
      throw error;
    }
  }

  // Send individual performance feedback
  async sendIndividualFeedback({ recipientEmail, recipientName, performanceData, feedback }) {
    try {
      if (!this.gmail) await this.initialize();

      const htmlBody = this.createIndividualFeedbackTemplate({
        recipientName,
        performanceData,
        feedback
      });

      const message = this.createMessage({
        to: recipientEmail,
        subject: `[PM] Performance Feedback - ${recipientName}`,
        htmlBody
      });

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: message }
      });

      // Log activity
      await this.logPMActivity({
        type: 'individual_feedback',
        recipient: recipientEmail,
        recipientName,
        messageId: result.data.id
      });

      console.log(`✅ Individual feedback sent to ${recipientEmail}`);
      return result.data;
    } catch (error) {
      console.error('❌ Failed to send individual feedback:', error);
      throw error;
    }
  }

  // Send urgent alert to team
  async sendUrgentAlert({ subject, message, priority = 'high', recipients = 'all' }) {
    try {
      if (!this.gmail) await this.initialize();

      let emailList = [];
      if (recipients === 'all') {
        // Fetch team emails from database
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
        const emailMessage = this.createMessage({
          to: email,
          subject: `🚨 [PM URGENT] ${subject}`,
          htmlBody,
          priority: 'high'
        });

        const result = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: emailMessage }
        });

        results.push({ email, messageId: result.data.id });
        console.log(`🚨 Urgent alert sent to ${email}`);
      }

      // Log activity
      await this.logPMActivity({
        type: 'urgent_alert',
        recipients: emailList,
        subject,
        priority
      });

      return { success: true, results };
    } catch (error) {
      console.error('❌ Failed to send urgent alert:', error);
      throw error;
    }
  }

  // Send metrics submission reminder
  async sendMetricsReminder({ targetDate, missingSubmissions }) {
    try {
      if (!this.gmail) await this.initialize();

      const htmlBody = this.createMetricsReminderTemplate({
        targetDate,
        missingSubmissions
      });

      const results = [];
      for (const submission of missingSubmissions) {
        const message = this.createMessage({
          to: submission.email,
          subject: `[PM] Metrics Submission Reminder - ${targetDate}`,
          htmlBody: htmlBody.replace('{{USER_NAME}}', submission.name)
        });

        const result = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: message }
        });

        results.push({ 
          email: submission.email, 
          name: submission.name,
          messageId: result.data.id 
        });

        console.log(`📋 Metrics reminder sent to ${submission.email}`);
      }

      // Log activity
      await this.logPMActivity({
        type: 'metrics_reminder',
        targetDate,
        recipients: missingSubmissions.map(s => s.email)
      });

      return { success: true, results };
    } catch (error) {
      console.error('❌ Failed to send metrics reminder:', error);
      throw error;
    }
  }

  // Get PM's email analytics
  async getEmailAnalytics() {
    try {
      if (!this.gmail) await this.initialize();

      const query = 'from:me label:sent';
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100
      });

      const messages = response.data.messages || [];
      
      // Get details for recent messages
      const recentMessages = await Promise.all(
        messages.slice(0, 20).map(async (message) => {
          const details = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });
          return this.formatEmailForAnalytics(details.data);
        })
      );

      return {
        totalSent: messages.length,
        recentMessages,
        analytics: this.calculateEmailAnalytics(recentMessages)
      };
    } catch (error) {
      console.error('❌ Failed to get email analytics:', error);
      throw error;
    }
  }

  // Email Templates
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

          <!-- Action Items -->
          <div style="background: #fff8e1; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #e65100;">📝 Action Items & Recommendations</h3>
            <ul style="margin: 0; padding-left: 20px; color: #e65100;">
              ${aggregatedKPIs.lateTasks > 5 ? '<li>Review SLA processes - high breach count detected</li>' : ''}
              ${aggregatedKPIs.completionRate < 70 ? '<li>Consider workload redistribution to improve completion rates</li>' : ''}
              <li>Schedule one-on-one meetings with team members showing completion rates below 60%</li>
              <li>Continue monitoring daily metrics submissions for real-time insights</li>
            </ul>
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
                <div><strong>Completion Rate:</strong> ${performanceData.completionRate}%</div>
                <div><strong>Tasks Completed:</strong> ${performanceData.completedTasks}</div>
                <div><strong>SLA Performance:</strong> ${performanceData.slaPerformance}%</div>
                <div><strong>Client Interactions:</strong> ${performanceData.clientInteractions}</div>
              </div>
            </div>

            <div style="background: #f1f8e9; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #2e7d32;">💭 Feedback</h3>
              <p style="margin: 0; line-height: 1.6; color: #333;">${feedback}</p>
            </div>

            <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #f57c00;">🎯 Next Steps</h3>
              <p style="margin: 0; color: #333;">Continue your great work and don't hesitate to reach out if you need any support or have questions about your performance metrics.</p>
            </div>
          </div>

          <div style="text-align: center; padding: 15px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Project Manager</strong><br>
              📧 dhaanushk1110@gmail.com
            </p>
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

          <div style="text-align: center; padding: 15px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Sent: ${new Date().toLocaleString()}<br>
              <strong>Project Manager</strong> | Team Performance Dashboard
            </p>
          </div>
        </div>
      </div>
    `;
  }

  createMetricsReminderTemplate({ targetDate, missingSubmissions }) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📋 Metrics Submission Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Daily metrics submission required</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 6px;">
            <h2 style="margin: 0 0 15px 0; color: #2c3e50;">Hi {{USER_NAME}}! 👋</h2>
            
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

            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0; color: #1976d2; font-size: 14px; text-align: center;">
                💡 <strong>Tip:</strong> Regular metric submissions help us maintain accurate performance tracking and support your professional development.
              </p>
            </div>
          </div>

          <div style="text-align: center; padding: 15px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Thanks for your cooperation!<br>
              <strong>Project Manager</strong> | Team Performance Dashboard
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // Helper methods
  createMessage({ to, cc, subject, htmlBody, priority = 'normal' }) {
    const messageParts = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      `Subject: ${subject}`,
      priority === 'high' ? 'X-Priority: 1' : '',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody
    ].filter(Boolean);

    const message = messageParts.join('\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }

  formatEmailForAnalytics(emailData) {
    const headers = emailData.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const to = headers.find(h => h.name === 'To')?.value || '';
    
    return {
      id: emailData.id,
      subject,
      to,
      timestamp: new Date(parseInt(emailData.internalDate)),
      snippet: emailData.snippet
    };
  }

  calculateEmailAnalytics(recentMessages) {
    const emailTypes = {
      alerts: 0,
      reports: 0,
      feedback: 0,
      reminders: 0,
      other: 0
    };

    recentMessages.forEach(email => {
      const subject = email.subject.toLowerCase();
      if (subject.includes('urgent') || subject.includes('alert')) {
        emailTypes.alerts++;
      } else if (subject.includes('report') || subject.includes('performance')) {
        emailTypes.reports++;
      } else if (subject.includes('feedback')) {
        emailTypes.feedback++;
      } else if (subject.includes('reminder')) {
        emailTypes.reminders++;
      } else {
        emailTypes.other++;
      }
    });

    return emailTypes;
  }

  async logPMActivity(activity) {
    console.log('📧 PM Email Activity:', {
      ...activity,
      timestamp: new Date().toISOString()
    });
    // You can store this in MongoDB for audit trails
  }
}

export default new ProjectManagerEmailService();