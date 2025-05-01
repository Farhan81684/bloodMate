//exports

const express = require("express");
const app = express();
const cors = require("cors");
const { log } = require("mercedlogger");
const dotenv = require("dotenv").config();
const { initSocket } = require("./src/utils/socket");

//middlewares
app.use(cors());
app.use(express.json());

//static uploads
app.use("/uploads", express.static("uploads"));


//dabatase connection
const databaseConnection = require("./src/config/dataBase");
databaseConnection();

//testing route
app.get("/", (req, res) => {
    log.yellow("route", "welcome to LOADBOAD");
    res.send("welcome to LOADBOAD apis");
});

// socket connection
const server = require("http").createServer(app);
initSocket(server);

// routes

const userRoutes = require("./src/routes/userRoutes");
app.use("/api/user", userRoutes);

//server

server.listen(process.env.PORT, () => {
    log.green("server", `server is running on port ${process.env.PORT}`);
});