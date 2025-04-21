const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
    },
    profile: {
        type: String,
        default: "https://www.kindpng.com/picc/m/78-785827_user-profile-avatar-login-person-user-icon-png.png"
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
    },
    phoneNo: {
        type: String,
    },
    address: {
        type: String,

    },
    toggleNotification: {
        type: Boolean,
        default: true
    },
    toggleBloodRequest: {
        type: Boolean,
        default: true
    },
    bloodGroup: {
        type: String,

    },

});

//export model
module.exports = mongoose.model('User', userSchema);