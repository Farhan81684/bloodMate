const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    unreadCount: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

// Create unique index for sender and receiver to prevent duplicate chat rooms
chatRoomSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);