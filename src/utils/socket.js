const SocketIo = require("socket.io");
const fs = require('fs');
const path = require('path');
const ChatRoom = require('../models/chatRoomSchema'); // Adjust the path to your model
const Notification = require('../models/notificationSchema'); // Adjust the path to your model
const User = require('../models/userModel'); // Adjust the path to your model


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
        socket.on("join_room", ({ userId }) => {
            if (!userId) {
                return;
            }

            const newUser = userId.toString();
            onlineUsers.set(newUser, { socketId: socket.id });
            console.log("onlineUsers", onlineUsers);

            socket.join(newUser);
        });


        // Define where images will be stored
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        socket.on("send_message", async ({ senderId, receiverId, message, image }) => {
            console.log("senderId", senderId, "receiverId", receiverId, "message", message);
            try {
                console.log("senderId", senderId, "receiverId", receiverId, "message", message);
                console.log("image", image);

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
                        console.log('Saving image to:', imagePath); // Log the image save path
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
                console.log("exist", chatRoom);

                if (!chatRoom) {
                    chatRoom = new ChatRoom({
                        sender: senderId,
                        receiver: receiverId,
                        messages: [],
                    });
                    await chatRoom.save();
                    console.log(`New chat room created between ${senderId} and ${receiverId}`);
                }

                const sender = await User.findById(senderId).select('profilePicture');
                console.log("sender", sender);
                const receiver = await User.findById(receiverId).select('profilePicture');
                console.log("receiver", receiver);

                // Add the new message
                const newMessage = {
                    user: senderId,
                    message,
                    image: imageUrl,
                    createdAt: new Date(),
                };

                chatRoom.messages.push(newMessage);

                // Update the last message
                chatRoom.lastMessage = {
                    user: senderId,
                    message,
                    image: imageUrl,
                    createdAt: new Date(),
                };

                await chatRoom.save();

                newMessage.senderProfilePic = sender.profilePicture;
                newMessage.receiverProfilePic = receiver.profilePicture;
                console.log("newMessage", newMessage);
                console.log('Chat room updated successfully with new message');
                newMessage.roomId = chatRoom._id;  // Add this line after creating newMessage
                newMessage.receiverId = receiverId;  // Add this line to explicitly set receiverId

                // Emit message to receiver
                io.to(receiverId).emit("received_message", {
                    ...newMessage,
                    roomId: chatRoom._id,
                    receiverId: receiverId
                });

                const updatedChatRoom = await ChatRoom.findById(chatRoom._id)
                    .populate("sender receiver")
                    .populate("lastMessage.user");

                io.to(receiverId).emit("newMessage", `New message from ${updatedChatRoom.sender.firstName}: ${message}`);


                io.to(senderId).emit("chat_room_updated", updatedChatRoom);
                io.to(receiverId).emit("chat_room_updated", updatedChatRoom);

            } catch (err) {
                console.error("Error sending message:", err);
            }
        });
        // Get all chat rooms for a user
        socket.on("get_chat_rooms", async (userId) => {
            console.log("recieved chat rooms", userId);

            try {
                const chatRooms = await ChatRoom.find({
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                })
                    .populate("sender receiver")
                    .populate("lastMessage.user");

                socket.emit("chat_rooms", chatRooms);

                console.log("chat rooms", chatRooms);
            } catch (err) {
                console.error("Error getting chat rooms:", err);
            }
        });

        // Get chat room messages
        socket.on("get_chat_room_messages", async (roomId) => {
            try {
                console.log("roomId", roomId);
                const chatRoom = await ChatRoom.findById(roomId);
                if (!chatRoom) {
                    return socket.emit("error", { message: "Chat room not found" });
                }
                const user = await User.findById(chatRoom.sender);
                const user2 = await User.findById(chatRoom.receiver);
                chatRoom.senderProfilePic = user.profilePicture;
                chatRoom.receiverProfilePic = user2.profilePicture;
                console.log("chat room messages", chatRoom.messages.toLocaleString);
                // Emit the messages to the user
                socket.emit("chat_room_messages", chatRoom.messages);

            } catch (err) {
                console.error("Error getting chat room messages:", err);
            }
        });


        // =========================== notification ===========================


        socket.on("send_notification", async ({ senderId, receiverId, message, type, title }) => {
            try {
                console.log("senderId", senderId, "receiverId", receiverId, "message", message);

                // Create new notification object
                const newNotification = {
                    title,
                    receiver: receiverId,
                    type,
                    message,
                    createdAt: new Date(),
                    isRead: false
                };

                // Add sender if provided
                if (senderId) {
                    newNotification.sender = senderId;
                }

                // Save to database
                const savedNotification = await Notification.create(newNotification);
                console.log('Notification created successfully');

                // Populate receiver
                let populatedNotification = await Notification.findById(savedNotification._id)
                    .populate("receiver", "firstName lastName");

                // Populate sender only if it exists
                if (senderId) {
                    populatedNotification = await populatedNotification.populate("sender", "firstName lastName");
                }

                // Emit full notification to receiver if online
                if (onlineUsers.has(receiverId.toString())) {
                    io.to(receiverId.toString()).emit("received_notification", populatedNotification);
                }

                // Optional: Send a simplified alert to receiver
                const senderName = populatedNotification.sender?.firstName || 'System';
                io.to(receiverId.toString()).emit("new_notification_alert", {
                    title: `New ${type} from ${senderName}`,
                    message
                });

            } catch (err) {
                console.error("Error sending notification:", err);
                socket.emit("notification_error", { message: "Failed to send notification" });
            }
        });

        // Get user notifications
        socket.on("get_notifications", async (userId) => {
            try {
                console.log("userId", userId);
                const notifications = await Notification.find({ receiver: userId })
                    .populate("sender", "firstName lastName profilePicture")
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .lean(); // Use lean() for better performance

                // Add 'isOnline' status for each notification sender
                const enhancedNotifications = notifications.map(notification => {
                    return {
                        ...notification,
                        sender: notification.sender ? {
                            ...notification.sender,
                            isOnline: onlineUsers.has(notification.sender._id.toString())
                        } : null
                    };
                });

                socket.emit("user_notifications", enhancedNotifications);
            } catch (err) {
                console.error("Error getting notifications:", err);
                socket.emit("notification_error", {
                    message: "Failed to load notifications",
                    error: err.message
                });
            }
        });


        // Mark notification as read
        socket.on("mark_notification_read", async (notificationId) => {
            try {
                const updatedNotification = await Notification.findByIdAndUpdate(
                    notificationId,
                    { isRead: true },
                    { new: true }
                ).populate("sender", "firstName lastName");

                if (updatedNotification) {
                    socket.emit("notification_marked_read", updatedNotification);
                }
            } catch (err) {
                console.error("Error marking notification as read:", err);
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

//send notification
const sendNotification = (socketId, event, data) => {
    if (io) {
        io.to(socketId).emit(event, data);
    }
};

function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
}

module.exports = { initSocket, getIO, sendNotification };



