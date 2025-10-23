import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';

// Load environment variables
dotenv.config();

class TeamLeaderEmailService {
  constructor() {
    this.transporter = null;
    this.currentTeamLeader = null;
  }

  async initialize(teamLeaderId) {
    try {
      // Find the team leader's information
      const teamLeader = await User.findById(teamLeaderId);
      if (!teamLeader || teamLeader.role !== 'team_lead') {
        throw new Error('Invalid team leader ID');
      }

      this.currentTeamLeader = teamLeader;

      // Use default email configuration for all team leaders
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'dhaanushk1110@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      });

      // Verify connection
      await this.transporter.verify();
      console.log(`✅ SMTP Email service initialized for team leader: ${teamLeader.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize SMTP service:', error);
      throw error;
    }
  }

  async sendTeamUpdate({ subject, message, priority = 'normal' }) {
    try {
      if (!this.transporter || !this.currentTeamLeader) {
        throw new Error('Email service not initialized');
      }

      // Get team members for this team leader
      const teamMembers = await User.find({ 
        role: 'team_member'
        // Add any other filters needed to get specific team members
      }).select('email name');

      if (teamMembers.length === 0) {
        throw new Error('No team members found');
      }

      const results = [];
      for (const member of teamMembers) {
        const mailOptions = {
          from: `"${this.currentTeamLeader.name} (Team Lead)" <${this.currentTeamLeader.email}>`,
          to: member.email,
          subject: `[TL Update] ${subject}`,
          html: this.createTeamUpdateTemplate({
            subject,
            message,
            priority,
            teamLeadName: this.currentTeamLeader.name
          })
        };

        const result = await this.transporter.sendMail(mailOptions);
        
        // Log the sent email
        await EmailLog.create({
          sender: this.currentTeamLeader.email,
          recipients: [member.email],
          subject: mailOptions.subject,
          content: mailOptions.html,
          messageId: result.messageId,
          type: 'team_update',
          priority,
          status: 'sent'
        });

        results.push({ 
          email: member.email,
          name: member.name,
          messageId: result.messageId 
        });
      }

      return { success: true, emailsSent: teamMembers.length, results };
    } catch (error) {
      console.error('❌ Failed to send team update:', error);
      throw error;
    }
  }

  async getEmails({ type = 'inbox', page = 1, limit = 10 }) {
    try {
      if (!this.currentTeamLeader) {
        throw new Error('Email service not initialized');
      }

      const skip = (page - 1) * limit;
      let query;

      if (type === 'inbox') {
        query = {
          recipients: this.currentTeamLeader.email,
          status: { $ne: 'deleted' }
        };
      } else if (type === 'outbox') {
        query = {
          sender: this.currentTeamLeader.email,
          status: { $ne: 'deleted' }
        };
      } else {
        throw new Error('Invalid email type');
      }

      const [emails, total] = await Promise.all([
        EmailLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        EmailLog.countDocuments(query)
      ]);

      return {
        emails,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      throw error;
    }
  }

  async markEmailAsRead(emailId) {
    try {
      if (!this.currentTeamLeader) {
        throw new Error('Email service not initialized');
      }

      const email = await EmailLog.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      if (!email.recipients.includes(this.currentTeamLeader.email)) {
        throw new Error('Unauthorized access to email');
      }

      if (!email.readBy.includes(this.currentTeamLeader.email)) {
        email.readBy.push(this.currentTeamLeader.email);
        await email.save();
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      throw error;
    }
  }

  createTeamUpdateTemplate({ subject, message, priority, teamLeadName }) {
    const priorityColors = {
      high: '#f44336',
      medium: '#ff9800',
      normal: '#2196f3'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColors[priority]}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📢 Team Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">From Team Leader: ${teamLeadName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 6px;">
            <h2 style="margin: 0 0 15px 0; color: #2c3e50;">${subject}</h2>
            <div style="line-height: 1.6; color: #333;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>This is an official communication from your Team Leader</p>
        </div>
      </div>
    `;
  }
}

export default new TeamLeaderEmailService();
