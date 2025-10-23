import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['urgent', 'feedback', 'report', 'reminder'],
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    recipients: [{
        email: { 
            type: String, 
            required: true,
            validate: {
                validator: function(email) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                },
                message: props => `${props.value} is not a valid email address!`
            }
        },
        name: String,
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        },
        messageId: String,
        sentAt: { type: Date, default: Date.now },
        readAt: Date
    }],
    content: {
        text: String,
        html: String
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'normal'],
        default: 'normal'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    sender: {
        email: {
            type: String,
            required: true,
            validate: {
                validator: function(email) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                },
                message: props => `${props.value} is not a valid email address!`
            }
        },
        name: String
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    },
    readBy: [{
        type: String,
        validate: {
            validator: function(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ type: 1, createdAt: -1 });
emailLogSchema.index({ 'recipients.email': 1, createdAt: -1 });

export default mongoose.model('EmailLog', emailLogSchema);