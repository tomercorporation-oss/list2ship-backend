const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('./middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;