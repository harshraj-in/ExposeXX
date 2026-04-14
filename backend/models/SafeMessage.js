import mongoose from 'mongoose';

const safeMessageSchema = new mongoose.Schema({
    reportId: {
        type: String,
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
    },
    senderRole: {
        type: String,
        enum: ['citizen', 'moderator'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // TTL index to auto-delete after 30 days
    }
});

const SafeMessage = mongoose.model('SafeMessage', safeMessageSchema);

export default SafeMessage;
