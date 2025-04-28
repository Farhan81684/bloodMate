const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    bloodRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest',
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export model
module.exports = mongoose.model('Notification', notificationSchema);
