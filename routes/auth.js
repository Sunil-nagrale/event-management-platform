const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { registerValidation, loginValidation } = require('../middleware/validators');

router.get('/register', isGuest, authController.showRegister);
router.post('/register', isGuest, registerValidation, validate, authController.register);

router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, loginValidation, validate, authController.login);

router.get('/logout', isAuthenticated, authController.logout);

router.get('/forgot-password', isGuest, authController.showForgotPassword);
router.post('/forgot-password', isGuest, authController.forgotPassword);

router.get('/reset-password/:token', isGuest, authController.showResetPassword);
router.post('/reset-password/:token', isGuest, authController.resetPassword);

module.exports = router;
