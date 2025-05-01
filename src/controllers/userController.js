const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateEmail = require("../utils/emailValidation");
const generateOTP = require("../utils/otpgenerator");
const transporter = require("../middlewares/nodemailer");
const Otp = require("../models/otpModel");


exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log("Signup data:", req.body);

        // Check for missing fields
        if (!email || !name || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ success: false, message: emailValidation.error });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save new user
        const newUser = new User({ email, name, password: hashedPassword });
        await newUser.save();

        return res.status(201).json({ success: true, message: "Signup successful", user: newUser });

    } catch (error) {
        console.error("Signup Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login data:", req.body);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//forgot password to send otp
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        //check if email is valid
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ message: emailValidation.error });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }

        //delete all previous otp
        await Otp.deleteMany({ email });
        const otp = generateOTP();
        const otpData = new Otp
            ({
                email,
                otp
            });
        await otpData.save();
        const mailOptions = {
            from: "ibtasamofficial@gmail.com",
            to: email,
            subject: "Password Reset",
            text: `Your OTP is ${otp}`,
        };
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
                return res.status(500).json({ message: "Failed to send email", error: error.message });
            } else {
                console.log('Email sent:', info.response);
                res.status(200).json({ message: "OTP sent successfully", otp: otp });
            }
        });
        
    
        console.log("OTP sent to email:", email, otp);
        res.status(200).json({ message: "OTP sent successfully", otp: otp });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//reset password
exports.resetPassword = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
//verify otp
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    console.log(email, otp);
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        const otpData = await Otp.findOne({ email });
        console.log(otpData);

        if (otpData.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
//resend otp
exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        //check if email is valid
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ message: emailValidation.error });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        const otp = generateOTP();
        const otpData = await Otp.findOne({ email });
        if (otpData) {
            otpData.otp = otp;
            await otpData.save();
        } else {
            const newOtpData = new Otp({ email, otp });
            await newOtpData.save();
        }
        const mailOptions = {
            from: "ibtasamofficial@gmail.com",
            to: email,
            subject: "Password Reset",
            text: `Your OTP is ${otp}`,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "OTP sent successfully", otp });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//update profile
exports.updateProfile = async (req, res) => {
    const { userName } = req.body;
    const userId = req.user.userId;
    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }

        const profile = req.file ? req.file.path : null;
        user.userName = userName || user.userName;
        user.profilePic = profile || user.profilePic;
        await user.save();

        res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get user details

exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        console.log(user)
        res.status(200).json({ message: "User details fetched successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;
    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


//togle notification
exports.toggleNotification = async (req, res) => {
    const userId = req.user.userId;
    console.log(userId);
    console.log("toggleNotification called")
    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        user.toggleNotification = !user.toggleNotification;
        await user.save();
        res.status(200).json({ message: "Notification toggled successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


//toggle blood request
exports.toggleBloodRequest = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        user.toggleBloodRequest = !user.toggleBloodRequest;
        await user.save();
        res.status(200).json({ message: "Blood request toggled successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


// setup profile controller
exports.setupProfile = async (req, res) => {
    const { phoneNumber, address, bloodGroup, name } = req.body;
    const userId = req.user.userId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        //handle image upload

        const profile = req.file ? req.file.path : null;
        if (profile) {
            user.profile = profile;
        }

        if (name) user.name = name;
        if (phoneNumber) user.phoneNo = phoneNumber;
        if (address) user.address = address;
        if (bloodGroup) user.bloodGroup = bloodGroup;

        await user.save();

        res.status(200).json({
            message: "Profile setup successfully",
            user,
        });
    } catch (error) {
        console.log("Error in setupProfile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


exports.addAddress = async (req, res) => {
    const { address } = req.body;
    const userId = req.user.userId;
    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        user.address = address;
        await user.save();
        res.status(200).json({ message: "Address added successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//get user details
exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        res.status(200).json({ message: "User details fetched successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


//change password
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;
    console.log("Change password called", req.body);
    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


//get users according to their blood group

exports.getUsersByBloodGroup = async (req, res) => {
    try {
        const { bloodGroup } = req.query;

        // If blood group is provided, filter users by blood group
        let query = {};
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        const users = await User.find(query);

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}