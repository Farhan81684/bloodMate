//exports

const express = require("express");
const app = express();
const cors = require("cors");
const { log } = require("mercedlogger");
const dotenv = require("dotenv").config();

//middlewares
app.use(cors());
app.use(express.json());

//dabatase connection
const databaseConnection = require("./src/config/dataBase");
databaseConnection();

//testing route
app.get("/", (req, res) => {
    log.yellow("route", "welcome to LOADBOAD");
    res.send("welcome to LOADBOAD apis");
});

//server

app.listen(process.env.PORT, () => {
    log.green("server", `server is running on port ${process.env.PORT}`);
});