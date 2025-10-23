import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

class GmailService {
  constructor() {
    this.oauth2Client = null;
    this.gmail = null;
  }

  async initialize(email) {
    try {
      // Create OAuth2 client
      this.oauth2Client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
      });

      // Set credentials
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      console.log('✅ Gmail service initialized successfully for:', email);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Gmail service:', error);
      throw error;
    }
  }

  async listEmails(query = 'in:inbox', maxResults = 20) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = [];
      for (const message of response.data.messages || []) {
        const email = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const headers = email.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value;
        const from = headers.find(h => h.name === 'From')?.value;
        const to = headers.find(h => h.name === 'To')?.value;
        const date = headers.find(h => h.name === 'Date')?.value;

        messages.push({
          id: email.data.id,
          threadId: email.data.threadId,
          subject,
          from,
          to,
          date,
          snippet: email.data.snippet,
          isRead: !(email.data.labelIds || []).includes('UNREAD')
        });
      }

      return messages;
    } catch (error) {
      console.error('Failed to list emails:', error);
      throw error;
    }
  }

  async sendEmail({ to, subject, html, attachments = [] }) {
    try {
      // Create email content
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        'From: me',
        `Subject: ${utf8Subject}`,
        '',
        html
      ];

      // Handle attachments if any
      if (attachments.length > 0) {
        // Implementation for attachments
        // This would involve creating multipart messages
      }

      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        messageId: res.data.id,
        threadId: res.data.threadId,
        labelIds: res.data.labelIds
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async getEmail(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const email = response.data;
      const headers = email.payload.headers;

      return {
        id: email.id,
        threadId: email.threadId,
        subject: headers.find(h => h.name === 'Subject')?.value,
        from: headers.find(h => h.name === 'From')?.value,
        to: headers.find(h => h.name === 'To')?.value,
        date: headers.find(h => h.name === 'Date')?.value,
        body: this.decodeBody(email.payload),
        attachments: this.getAttachments(email.payload),
        labels: email.labelIds
      };
    } catch (error) {
      console.error('Failed to get email:', error);
      throw error;
    }
  }

  decodeBody(payload) {
    if (payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html') {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.mimeType === 'text/plain') {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }

  getAttachments(payload) {
    const attachments = [];

    const processPayloadForAttachments = (part) => {
      if (part.filename && part.body) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId
        });
      }
      if (part.parts) {
        part.parts.forEach(processPayloadForAttachments);
      }
    };

    processPayloadForAttachments(payload);
    return attachments;
  }

  async downloadAttachment(messageId, attachmentId) {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      return Buffer.from(response.data.data, 'base64');
    } catch (error) {
      console.error('Failed to download attachment:', error);
      throw error;
    }
  }

  async markAsRead(messageId) {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      throw error;
    }
  }

  async markAsUnread(messageId) {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to mark email as unread:', error);
      throw error;
    }
  }

  async archiveEmail(messageId) {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX']
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to archive email:', error);
      throw error;
    }
  }

  async deleteEmail(messageId) {
    try {
      await this.gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      });
      return true;
    } catch (error) {
      console.error('Failed to delete email:', error);
      throw error;
    }
  }

  async getEmailThread(threadId) {
    try {
      const response = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      const thread = response.data;
      const messages = thread.messages.map(message => {
        const headers = message.payload.headers;
        return {
          id: message.id,
          subject: headers.find(h => h.name === 'Subject')?.value,
          from: headers.find(h => h.name === 'From')?.value,
          to: headers.find(h => h.name === 'To')?.value,
          date: headers.find(h => h.name === 'Date')?.value,
          body: this.decodeBody(message.payload),
          attachments: this.getAttachments(message.payload),
          isRead: !message.labelIds.includes('UNREAD')
        };
      });

      return {
        id: thread.id,
        messages: messages,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('Failed to get email thread:', error);
      throw error;
    }
  }
}

const gmailService = new GmailService();
export default gmailService;