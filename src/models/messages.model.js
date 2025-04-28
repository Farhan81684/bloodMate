const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String
    },
    image: {
        type: String
    },
    audio: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create index for faster querying messages by chatRoom
messageSchema.index({ chatRoom: 1 });
// Create index for querying unread messages
messageSchema.index({ chatRoom: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);