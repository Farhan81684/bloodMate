const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { log } = require("mercedlogger");
dotenv.config();

const db = process.env.DATABASE_URL;
// console.log("db ==>", process.env.DATABASE_URL);
const databaseConnection = () => {
    mongoose
        .connect(db, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        })
        .then(() => {
            log.green("database connection", "database connected");
        })
        .catch((e) => {
            log.red(`database connection`, `${e}`);
        });
};
module.exports = databaseConnection;
