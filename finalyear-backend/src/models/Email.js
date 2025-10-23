import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  senderEmail: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    enum: ['project_manager', 'team_lead', 'team_member', 'system'],
    required: true
  },
  receiverEmail: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverRole: {
    type: String,
    enum: ['project_manager', 'team_lead', 'team_member'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['direct', 'update', 'reminder', 'alert', 'report', 'system'],
    default: 'direct'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'read', 'archived', 'failed', 'draft', 'deleted'],
    default: 'sent'
  },
  folder: {
    type: String,
    enum: ['inbox', 'outbox', 'archived', 'drafts', 'trash'],
    required: true
  },
  readAt: {
    type: Date
  },
  attachments: [{
    filename: String,
    path: String,
    mimeType: String,
    size: Number
  }],
  metadata: {
    deliveryAttempts: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    errorLogs: [{
      timestamp: Date,
      error: String
    }],
    tags: [String],
    importance: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
emailSchema.index({ senderEmail: 1, folder: 1 });
emailSchema.index({ receiverEmail: 1, folder: 1 });
emailSchema.index({ timestamp: -1 });
emailSchema.index({ status: 1 });
emailSchema.index({ 'metadata.tags': 1 });

// Add text search capability
emailSchema.index({
  subject: 'text',
  message: 'text',
  senderName: 'text',
  receiverName: 'text'
});

const Email = mongoose.model('Email', emailSchema);

export default Email;