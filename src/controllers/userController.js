const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateEmail = require("../utils/emailValidation");
const generateOTP = require("../utils/otpgenerator");
const transporter = require("../middlewares/nodemailer");
const Otp = require("../models/otpModel");


//signup
exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        //check if email is uniqque
        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ message: emailValidation.error });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(200).json({ message: "Signup successful" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//login
exports.login = async (req, res) => {
    const { email, password } = req.body;
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
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "OTP sent successfully", otp: otp });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//reset password
exports.resetPassword = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }

        //check otp is verified
        const otpData = await Otp.findOne({ email });
        if (otpData.isVerified === false || !otpData) {
            return res.status(400).json({ message: "Email is not verified or session has expired please verify again" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }
        const otpData = await Otp.findOne({ email });
        if (otpData.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        otpData.isVerified = true;
        await otpData.save();
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
    const userId = req.user.userId;
    try {
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