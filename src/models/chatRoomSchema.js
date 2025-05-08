const mongoose = require("mongoose");

const chatRoomsSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
            message: { type: String, },
            image: { type: String },
            audio: { type: String },
            createdAt: { type: Date, default: Date.now },
            senderProfilePic: { type: String },
            receiverProfilePic: { type: String },
        },
    ],
    lastMessage: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
        message: { type: String },
        image: { type: String },
        audio: { type: String },
        createdAt: { type: Date },
        senderProfilePic: { type: String },
        receiverProfilePic: { type: String },
    },
    unreadCount: { type: Number, default: 0 },
}, { timestamps: true });

// Create unique index for user1 and user2 to prevent duplicate chat rooms
chatRoomsSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model("ChatRoom", chatRoomsSchema);
