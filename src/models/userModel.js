const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Name is required"]
    },
    profile: {
        type: String,
        default: "https://www.kindpng.com/picc/m/78-785827_user-profile-avatar-login-person-user-icon-png.png"
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    }
});