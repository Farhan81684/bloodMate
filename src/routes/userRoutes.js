const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/multer');

const bloodRequestController = require('../controllers/bloodRequest');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/sendotp', userController.forgotPassword);
router.post('/verifyotp', userController.verifyOTP);
router.put('/resetpassword', userController.resetPassword);
// router.put('/updateprofile', userController.updateProfile);
router.put('/resendOtp', userController.resendOtp);
router.post('/togleNotification', authMiddleware, userController.toggleNotification);
router.post('/setupProfile', authMiddleware, upload.single('profile'), userController.setupProfile);
router.post('/toggleBloodRequest', authMiddleware, userController.toggleBloodRequest);
router.get('/me', authMiddleware, userController.getUserDetails);
router.post('/addAddress', authMiddleware, userController.addAddress);
// router.post('/updateProfile', authMiddleware, upload.single('profilePic'), userController.updateProfile);

router.put('/changePassword', authMiddleware, userController.changePassword);
router.post('/getUsersByBloodGroup', authMiddleware, userController.getUsersByBloodGroup);

//blood request routes
router.post('/addBloodRequest', authMiddleware, bloodRequestController.BloodRequest);
router.get('/getAllBloodRequests', authMiddleware, bloodRequestController.getAllBloodRequests);
router.get('/getBloodRequestByBloodGroup', authMiddleware, bloodRequestController.getBloodRequestByBloodGroup);
router.get('/getMyBloodRequests', authMiddleware, bloodRequestController.getMyBloodRequests);

module.exports = router;