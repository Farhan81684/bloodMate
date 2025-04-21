const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/me', userController.getUserDetails);
router.post('/sendotp', userController.forgotPassword);
router.post('/verifyotp', userController.verifyOTP);
router.put('/resetpassword', userController.resetPassword);
router.put('/updateprofile', userController.updateProfile);
router.put('/resendOtp', userController.resendOtp);

module.exports = router;