const express = require('express');
const router = express.Router();
const authController = require('../controllers/Auth');

// Register User
router.post('/register', authController.register);

// Login User
router.post('/login', authController.login);

//delete users
// Register User
router.delete('/', authController.deleteAllUsers);


// Verify Email
router.get('/verify-email/:token', authController.verifyEmail);

// Request Password Reset
router.post('/request-password-reset', authController.requestPasswordReset);

// Reset Password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
