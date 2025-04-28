const SocketIo = require("socket.io");
const fs = require('fs');
const path = require('path');
const Message = require('../models/messages.model'); // Adjust the path to your model
const ChatRoom = require('../models/chatRoomSchema'); // Adjust the path to your model


let io; // To store Socket.IO instance
const onlineUsers = new Map(); // To track online users

const initSocket = (server) => {
    io = SocketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {

        // Handle user joining
        socket.on("join_room", ({ userId, role }) => {
            if (!userId || !role) {
                return;
            }

            const newUser = userId.toString();
            onlineUsers.set(newUser, { socketId: socket.id, role });

            socket.join(newUser);
        });


        // Define where images will be stored
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }


        // Socket handlers updated to work with separate Message and ChatRoom models

        socket.on("send_audio_message", async (formData) => {
            try {
                const { senderId, receiverId } = formData;
                const audioFile = formData.audio;
                const donationId = formData.donationId;

                if (!audioFile) {
                    return socket.emit("error", { message: "No audio file provided" });
                }

                // Validate if the file is a valid audio type
                const allowedTypes = ["audio/wav", "audio/mp3", "audio/mpeg"];
                if (!allowedTypes.includes(audioFile.mimetype)) {
                    return socket.emit("error", { message: "Invalid audio format" });
                }

                // Save the audio file
                const audioName = `${Date.now()}-${senderId}.wav`;
                const audioPath = path.join(uploadDir, audioName);

                try {
                    await audioFile.mv(audioPath);
                } catch (err) {
                    console.error("Error saving audio:", err);
                    return socket.emit("error", { message: "Failed to save audio" });
                }

                // Store audio file URL
                const audioUrl = `/uploads/${audioName}`;

                // Find or create chat room
                let chatRoom = await ChatRoom.findOne({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId }
                    ]
                });

                if (!chatRoom) {
                    chatRoom = new ChatRoom({
                        sender: senderId,
                        receiver: receiverId,
                        unreadCount: 0
                    });
                    await chatRoom.save();
                }

                // Create a new message document
                const newMessage = new Message({
                    chatRoom: chatRoom._id,
                    sender: senderId,
                    message: null, // No text message
                    audio: audioUrl, // The URL to the audio file
                });

                // Save the message
                await newMessage.save();

                // Update the chat room with the last message reference
                chatRoom.lastMessage = newMessage._id;

                // Increment unread count if the receiver is not the sender
                if (receiverId !== senderId) {
                    chatRoom.unreadCount += 1;
                }

                await chatRoom.save();

                // Get the populated message to send back
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('sender', 'firstName lastName avatar');

                // Emit message to receiver
                io.to(receiverId).emit("received_message", populatedMessage);

                // Get updated chat room with populated fields
                const updatedChatRoom = await ChatRoom.findById(chatRoom._id)
                    .populate("sender", "firstName lastName avatar")
                    .populate("receiver", "firstName lastName avatar")
                    .populate({
                        path: "lastMessage",
                        populate: {
                            path: "sender",
                            select: "firstName lastName avatar"
                        }
                    });

                io.to(senderId).emit("chat_room_updated", updatedChatRoom);
                io.to(receiverId).emit("chat_room_updated", updatedChatRoom);

            } catch (err) {
                console.error("Error sending audio message:", err);
                socket.emit("error", { message: "Failed to send audio message" });
            }
        });

        socket.on("send_message", async ({ senderId, receiverId, message, image }) => {
            try {
                // Handle image upload
                let imageUrl = null;
                if (image) {
                    // Validate if the image is a valid base64 string
                    if (typeof image === 'string' && image.startsWith('data:image/')) {
                        const base64Data = image.split(',')[1]; // Extract base64 content
                        const buffer = Buffer.from(base64Data, 'base64'); // Convert to Buffer

                        // Save the image
                        const imageName = `${Date.now()}-${senderId}.jpg`;
                        const imagePath = path.join(uploadDir, imageName);
                        try {
                            fs.writeFileSync(imagePath, buffer); // Write to file system
                        } catch (err) {
                            console.error("Error saving image:", err);
                            return socket.emit("error", { message: "Failed to save image" });
                        }
                        // Write to file system
                        imageUrl = `uploads/${imageName}`; // Set the accessible image path
                    } else {
                        console.error("Invalid image format");
                        return socket.emit("error", { message: "Invalid image format" });
                    }
                }

                // Find or create chat room
                let chatRoom = await ChatRoom.findOne({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId }
                    ]
                });

                if (!chatRoom) {
                    chatRoom = new ChatRoom({
                        sender: senderId,
                        receiver: receiverId,
                        unreadCount: 0
                    });
                    await chatRoom.save();
                }

                // Create a new message
                const newMessage = new Message({
                    chatRoom: chatRoom._id,
                    sender: senderId,
                    message,
                    image: imageUrl
                });

                // Save the message
                await newMessage.save();

                // Update the chat room with the last message reference
                chatRoom.lastMessage = newMessage._id;

                // Increment unread count if the receiver is not the sender
                if (receiverId !== senderId) {
                    chatRoom.unreadCount += 1;
                }

                await chatRoom.save();

                // Get the populated message to send back
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('sender', 'firstName lastName avatar');

                // Emit message to receiver
                io.to(receiverId).emit("received_message", populatedMessage);

                // Get updated chat room with populated fields
                const updatedChatRoom = await ChatRoom.findById(chatRoom._id)
                    .populate("sender", "firstName lastName avatar")
                    .populate("receiver", "firstName lastName avatar")
                    .populate({
                        path: "lastMessage",
                        populate: {
                            path: "sender",
                            select: "firstName lastName avatar"
                        }
                    });

                // Notify receiver about new message
                const senderName = updatedChatRoom.sender.firstName;
                io.to(receiverId).emit("newMessage", `New message from ${senderName}: ${message}`);

                // Update chat room for both users
                io.to(senderId).emit("chat_room_updated", updatedChatRoom);
                io.to(receiverId).emit("chat_room_updated", updatedChatRoom);

            } catch (err) {
                console.error("Error sending message:", err);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Get all chat rooms for a user
        socket.on("get_chat_rooms", async (userId) => {
            try {
                const chatRooms = await ChatRoom.find({
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                })
                    .populate("sender", "firstName lastName avatar")
                    .populate("receiver", "firstName lastName avatar")
                    .populate({
                        path: "lastMessage",
                        populate: {
                            path: "sender",
                            select: "firstName lastName avatar"
                        }
                    });

                socket.emit("chat_rooms", chatRooms);
            } catch (err) {
                console.error("Error getting chat rooms:", err);
                socket.emit("error", { message: "Failed to get chat rooms" });
            }
        });

        // Get chat room messages
        socket.on("get_chat_room_messages", async (roomId) => {
            try {
                const chatRoom = await ChatRoom.findById(roomId);
                if (!chatRoom) {
                    return socket.emit("error", { message: "Chat room not found" });
                }

                // Get messages for this chat room
                const messages = await Message.find({ chatRoom: roomId })
                    .populate('sender', 'firstName lastName avatar')
                // .sort({ createdAt: -1 });


                chatRoom.unreadCount = 0;
                await chatRoom.save();

                socket.emit("chat_room_messages", messages);
            } catch (err) {
                console.error("Error getting chat room messages:", err);
                socket.emit("error", { message: "Failed to get chat room messages" });
            }
        });

        // Add a new handler for marking messages as read
        socket.on("mark_messages_read", async ({ chatRoomId, userId }) => {
            try {
                // Find the chat room
                const chatRoom = await ChatRoom.findById(chatRoomId);
                if (!chatRoom) {
                    return socket.emit("error", { message: "Chat room not found" });
                }

                // Reset unread counter only if this user is the receiver
                if (chatRoom.receiver.toString() === userId || chatRoom.sender.toString() === userId) {
                    // Mark messages as read
                    await Message.updateMany(
                        {
                            chatRoom: chatRoomId,
                            sender: { $ne: userId }, // Only mark messages not sent by this user
                            isRead: false
                        },
                        { isRead: true }
                    );

                    // Reset unread count
                    chatRoom.unreadCount = 0;
                    await chatRoom.save();

                    // Get the updated chat room
                    const updatedChatRoom = await ChatRoom.findById(chatRoomId)
                        .populate("sender", "firstName lastName avatar")
                        .populate("receiver", "firstName lastName avatar")
                        .populate({
                            path: "lastMessage",
                            populate: {
                                path: "sender",
                                select: "firstName lastName avatar"
                            }
                        });

                    // Notify both users about the update
                    io.to(chatRoom.sender.toString()).emit("chat_room_updated", updatedChatRoom);
                    io.to(chatRoom.receiver.toString()).emit("chat_room_updated", updatedChatRoom);

                    socket.emit("messages_marked_read");
                }
            } catch (err) {
                console.error("Error marking messages as read:", err);
                socket.emit("error", { message: "Failed to mark messages as read" });
            }
        });

        // Add this to your existing socket.io setup

        // Socket event handler for searching chatrooms
        socket.on("search_chatrooms", async (data) => {
            try {
                const { userId, searchQuery } = data;

                if (!searchQuery || !userId) {
                    return socket.emit("search_chatrooms_error", {
                        success: false,
                        message: "User ID and search query are required"
                    });
                }

                // Find all chatrooms where the user is either sender or receiver
                const userChatRooms = await ChatRoom.find({
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                })
                    .populate("sender", "firstName lastName avatar")
                    .populate("receiver", "firstName lastName avatar")
                    .populate({
                        path: "lastMessage",
                        populate: {
                            path: "sender",
                            select: "firstName lastName avatar"
                        }
                    });

                // Get all chatroom IDs
                const chatRoomIds = userChatRooms.map(room => room._id);

                // Find messages matching the search query
                const matchingMessages = await Message.find({
                    chatRoom: { $in: chatRoomIds },
                    message: { $regex: searchQuery, $options: 'i' } // Case-insensitive search
                })
                    .populate("sender", "firstName lastName avatar");

                // Group messages by chatroom
                const messagesByChatRoom = {};
                matchingMessages.forEach(msg => {
                    const chatRoomId = msg.chatRoom.toString();
                    if (!messagesByChatRoom[chatRoomId]) {
                        messagesByChatRoom[chatRoomId] = [];
                    }
                    messagesByChatRoom[chatRoomId].push(msg);
                });

                // Format search results
                const searchResults = userChatRooms
                    .filter(room => messagesByChatRoom[room._id.toString()])
                    .map(room => {
                        // Get the other user (not the current user)
                        const otherUser = room.sender._id.toString() === userId ?
                            room.receiver : room.sender;

                        // Get messages for this chatroom
                        const messages = messagesByChatRoom[room._id.toString()];

                        return {
                            chatRoomId: room._id,
                            otherUser: {
                                _id: otherUser._id,
                                name: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim(),
                                avatar: otherUser.avatar
                            },
                            // Include up to 3 matching messages, sorted by most recent first
                            matchingMessages: messages
                                .sort((a, b) => b.createdAt - a.createdAt)
                                .slice(0, 3)
                                .map(msg => ({
                                    _id: msg._id,
                                    message: msg.message,
                                    sender: {
                                        _id: msg.sender._id,
                                        name: `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim(),
                                        avatar: msg.sender.avatar
                                    },
                                    createdAt: msg.createdAt
                                })),
                            matchCount: messages.length,
                            lastMessage: room.lastMessage ? {
                                _id: room.lastMessage._id,
                                message: room.lastMessage.message,
                                audio: room.lastMessage.audio,
                                image: room.lastMessage.image,
                                sender: room.lastMessage.sender ? {
                                    _id: room.lastMessage.sender._id,
                                    name: `${room.lastMessage.sender.firstName || ''} ${room.lastMessage.sender.lastName || ''}`.trim()
                                } : null,
                                createdAt: room.lastMessage.createdAt
                            } : null,
                            unreadCount: room.unreadCount
                        };
                    });

                // Send search results back to the client
                socket.emit("search_chatrooms_results", {
                    success: true,
                    count: searchResults.length,
                    query: searchQuery,
                    results: searchResults
                });

            } catch (error) {
                console.error("Error searching chatrooms:", error);
                socket.emit("search_chatrooms_error", {
                    success: false,
                    message: "Failed to search chatrooms: " + error.message
                });
            }
        });

        // You can also add a handler for searching messages within a specific chatroom
        socket.on("search_chatroom_messages", async (data) => {
            try {
                const { chatRoomId, searchQuery } = data;

                if (!chatRoomId || !searchQuery) {
                    return socket.emit("search_messages_error", {
                        success: false,
                        message: "Chat room ID and search query are required"
                    });
                }

                // Verify the chat room exists
                const chatRoom = await ChatRoom.findById(chatRoomId);
                if (!chatRoom) {
                    return socket.emit("search_messages_error", {
                        success: false,
                        message: "Chat room not found"
                    });
                }

                // Search for messages in this specific chat room
                const messages = await Message.find({
                    chatRoom: chatRoomId,
                    message: { $regex: searchQuery, $options: 'i' }
                })
                    .populate("sender", "firstName lastName avatar")
                    .sort({ createdAt: -1 });

                // Format and send the results
                socket.emit("search_messages_results", {
                    success: true,
                    chatRoomId,
                    count: messages.length,
                    query: searchQuery,
                    messages: messages.map(msg => ({
                        _id: msg._id,
                        message: msg.message,
                        audio: msg.audio,
                        image: msg.image,
                        sender: {
                            _id: msg.sender._id,
                            name: `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim(),
                            avatar: msg.sender.avatar
                        },
                        createdAt: msg.createdAt,
                        isRead: msg.isRead
                    }))
                });

            } catch (error) {
                console.error("Error searching messages:", error);
                socket.emit("search_messages_error", {
                    success: false,
                    message: "Failed to search messages: " + error.message
                });
            }
        });



        // Handle disconnection
        socket.on("disconnect", () => {
            for (const [userId, userInfo] of onlineUsers.entries()) {
                if (userInfo.socketId === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
        });
    });
};

// Emit custom events
const sendNotification = (socketId, event, data) => {
    if (io) {
        io.to(socketId).emit(event, data);
    }
};

const emitData = (socketId, event, data) => {
    if (io) {
        io.to(socketId).emit(event, data);
    }
};

module.exports = { initSocket, sendNotification, emitData };



