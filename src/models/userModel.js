const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    profile: {
        type: String,
        default: ""
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
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],

    },
});

// export model
module.exports = mongoose.model('User', userSchema);
