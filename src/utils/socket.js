const SocketIo = require("socket.io");
let io;
const userSocketMap = new Map();

const initSocket = (server) => {
    io = SocketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("New user connected:", socket.id);

        // Handle user joining room with their userId
        socket.on("join_room", (userId) => {
            socket.join(userId);
            console.log("User joined room:", userId);
            userSocketMap.set(userId, socket.id); // Map userId to socket.id
        });

        // Handle user disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);

            // Find and delete the disconnected user's entry from userSocketMap
            for (const [userId, sId] of userSocketMap.entries()) {
                if (sId === socket.id) {
                    userSocketMap.delete(userId);
                    break;
                }
            }
        });
    });
};


const addmember = (userId, events, data) => {
    if (io) {
        io.to(userId).emit(events, data);
        console.log("data", data);

    }
}

const acceptNotification = (userId, events, data) => {
    if (io) {
        io.to(userId).emit(events, data);
        console.log("data", data);
    }
}

const rejectNotification = (userId, events, data) => {
    if (io) {
        io.to(userId).emit(events, data);
        console.log("data", data);
    }
}

const sendNotification = (userId, events, data) => {
    if (io) {
        io.to(userId).emit(events, data);
        // console.log("data", data);
    }
}

const joinsquad = (userId, events, data) => {
    if (io) {
        io.to(userId).emit(events, data);
        console.log("data", data);
    }
}

const updateSquadList = (userId, events, data) => {
    if (io) {
        io.to(userId).emit(events, data);
        // console.log(`Squad list updated for user ${userId} with event: ${events}`, data);
    }






}


module.exports = { initSocket, addmember, acceptNotification, updateSquadList, rejectNotification, sendNotification, joinsquad };