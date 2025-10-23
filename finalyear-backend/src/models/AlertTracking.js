import mongoose from 'mongoose';

const alertTrackingSchema = new mongoose.Schema({
    alertId: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'normal'],
        default: 'normal'
    },
    sender: {
        type: String,
        required: true
    },
    recipients: [{
        email: {
            type: String,
            required: true
        },
        deliveryStatus: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        },
        readStatus: {
            type: Boolean,
            default: false
        },
        readTimestamp: Date,
        deliveryTimestamp: Date
    }],
    sentAt: {
        type: Date,
        default: Date.now
    },
    messageId: String
});

export default mongoose.model('AlertTracking', alertTrackingSchema);