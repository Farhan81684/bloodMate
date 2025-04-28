const User = require('../models/userModel');
const BloodRequest = require('../models/bloodRequest');
const Notification = require('../models/notificationModel');
const { sendNotification } = require('../utils/socket');




//post blood request

exports.BloodRequest = async (req, res) => {
    try {
        const userId = req.user.userId; // Get the user ID from the authenticated user
        const {
            patientName,
            BloodType,
            Age,
            Disease,
            location,
            contact
        } = req.body;

        // Validation: check required fields
        if (!userId || !patientName || !BloodType || !Age || !Disease || !location?.lat || !location?.lng || !contact) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const newBloodRequest = new BloodRequest({
            userId,
            patientName,
            BloodType,
            Age,
            Disease,
            location,
            contact
        });

        const savedBloodRequest = await newBloodRequest.save();

        // Find all users whose toggleNotification is true
        const users = await User.find({ toggleNotification: true });

        for (const user of users) {
            // Create and save notification for each user
            const newNotification = new Notification({
                userId: user._id,
                title: 'New Blood Request',
                message: `A new blood request has been created by ${patientName}.`,
                bloodRequestId: savedBloodRequest._id
            });

            await newNotification.save();

            // Send notification to user
            sendNotification(user._id.toString(), 'notification', newNotification);
        }



        return res.status(201).json({
            success: true,
            message: 'Blood request created successfully.',
            data: savedBloodRequest
        });
    } catch (error) {
        console.error('Error creating blood request:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}


//get all blood requests
exports.getAllBloodRequests = async (req, res) => {
    try {
        const bloodRequests = await BloodRequest.find().populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest');
        return res.status(200).json({
            success: true,
            message: 'All blood requests fetched successfully.',
            data: bloodRequests
        });
    } catch (error) {
        console.error('Error fetching blood requests:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}

//get blood request by blood group
exports.getBloodRequestByBloodGroup = async (req, res) => {
    try {
        const { bloodGroup } = req.query;
        const bloodRequests = await BloodRequest.find({ BloodType: bloodGroup }).populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest');
        return res.status(200).json({
            success: true,
            message: `Blood requests for ${bloodGroup} fetched successfully.`,
            data: bloodRequests
        });
    } catch (error) {
        console.error('Error fetching blood requests:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}


//get my blood requests
exports.getMyBloodRequests = async (req, res) => {
    try {
        const userId = req.user.userId; // Get the user ID from the authenticated user
        const bloodRequests = await BloodRequest.find({ userId }).populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest');
        return res.status(200).json({
            success: true,
            message: 'My blood requests fetched successfully.',
            data: bloodRequests
        });
    } catch (error) {
        console.error('Error fetching my blood requests:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}