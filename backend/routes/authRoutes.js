const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// OTP Routes
router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);

// External Ticket Routes
router.post('/external-ticket', authController.issueExternalTicket);
router.post('/ticket-exchange', authController.exchangeTicket);

// Traditional Register / Login / Verification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);

// Password Reset Routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
