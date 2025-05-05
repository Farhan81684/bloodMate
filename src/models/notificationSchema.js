const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
});

// Add full-text index for searching notifications
notificationSchema.index({ title: "text", message: "text" });

module.exports = mongoose.model('Notification', notificationSchema);
