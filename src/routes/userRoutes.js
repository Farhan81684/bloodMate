const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/multer');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/sendotp', userController.forgotPassword);
router.post('/verifyotp', userController.verifyOTP);
router.put('/resetpassword', userController.resetPassword);
router.put('/updateprofile', userController.updateProfile);
router.put('/resendOtp', userController.resendOtp);
router.post('/togleNotification', authMiddleware, userController.toggleNotification);
router.post('/uploadProfilePic', authMiddleware, upload.single('profilePic'), userController.addProfilePic);
router.post('/toggleBloodRequest', authMiddleware, userController.toggleBloodRequest);
router.get('/me', authMiddleware, userController.getUserDetails);
router.post('/addAddress', authMiddleware, userController.addAddress);
router.post('/updateProfile', authMiddleware, upload.single('profilePic'), userController.updateProfile);



module.exports = router;