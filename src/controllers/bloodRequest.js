const User = require('../models/userModel');
const BloodRequest = require('../models/bloodRequest');
const Notification = require('../models/notificationSchema');
const { sendNotification } = require('../utils/socket');



// get blood types
exports.getBloodTypes = async (req, res) => {
    console.log('Fetching blood types...');
    try {
        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        return res.status(200).json({
            success: true,
            message: 'Blood types fetched successfully.',
            data: bloodTypes
        });
    } catch (error) {
        console.error('Error fetching blood types:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}


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

        console.log(req.body);

        // Validation: check required fields
        if (!userId || !patientName || !BloodType || !Age || !Disease || !location || !contact) {
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
                sender: userId,
                receiver: user._id,
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
// exports.getAllBloodRequests = async (req, res) => {
//     try {
//         const bloodRequests = await BloodRequest.find().populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest');
//         return res.status(200).json({
//             success: true,
//             message: 'All blood requests fetched successfully.',
//             data: bloodRequests
//         });
//     } catch (error) {
//         console.error('Error fetching blood requests:', error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || 'Internal server error'
//         });
//     }
// }

// //get blood request by blood group
// exports.getBloodRequestByBloodGroup = async (req, res) => {
//     try {
//         const { bloodGroup } = req.query;
//         const bloodRequests = await BloodRequest.find({ BloodType: bloodGroup }).populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest').sort({ createdAt: -1 });
//         return res.status(200).json({
//             success: true,
//             message: `Blood requests for ${bloodGroup} fetched successfully.`,
//             data: bloodRequests
//         });
//     } catch (error) {
//         console.error('Error fetching blood requests:', error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || 'Internal server error'
//         });
//     }
// }


exports.getBloodRequests = async (req, res) => {
    try {
        const { bloodGroup } = req.query;
        const cleanBloodGroup = bloodGroup?.replace(' ', '+'); // fix A+ → A

        const filter = cleanBloodGroup ? { BloodType: cleanBloodGroup.trim() } : {};

        console.log(filter);

        const bloodRequests = await BloodRequest.find(filter)
            .populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest')
            .sort({ createdAt: -1 });

        const message = bloodGroup
            ? `Blood requests for ${bloodGroup} fetched successfully.`
            : 'All blood requests fetched successfully.';

        console.log(bloodRequests);

        return res.status(200).json({
            success: true,
            message,
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
        console.log(userId);
        const bloodRequests = await BloodRequest.find({ userId }).populate('userId', 'name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest');
        console.log(bloodRequests);
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




// find donor by blood group find by blood group like blood group: BloofGroup and aavailable: true
// find by blood group
exports.findDonorByBloodGroup = async (req, res) => {
    try {
        const { bloodGroup } = req.query;
        if (!bloodGroup) {
            return res.status(400).json({
                success: false,
                message: 'Blood group is required.'
            });
        }
        console.log(bloodGroup);

        const cleanBloodGroup = bloodGroup?.replace(' ', '+');

        const donors = await User.find({ bloodGroup: cleanBloodGroup, toggleBloodRequest: true }).select('name profile bloodGroup phoneNo address toggleNotification toggleBloodRequest');
        return res.status(200).json({
            success: true,
            message: `Donors for ${bloodGroup} fetched successfully.`,
            data: donors
        });
    } catch (error) {
        console.error('Error fetching donors:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}




//get requested blood groups if dublicate blood groups are there then send them only once not twice
exports.getRequestedBloodGroups = async (req, res) => {
    try {
        const requestedBloodGroups = await BloodRequest.distinct('BloodType');
        return res.status(200).json({
            success: true,
            message: 'Requested blood groups fetched successfully.',
            data: requestedBloodGroups
        });
    } catch (error) {
        console.error('Error fetching requested blood groups:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}