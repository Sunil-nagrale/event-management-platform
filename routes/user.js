const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { profileValidation } = require('../middleware/validators');

router.use(ensureAuthenticated);

router.get('/', userController.dashboard);
router.get('/profile', userController.profile);
router.put('/profile', profileValidation, validate, userController.updateProfile);
router.get('/bookings', userController.bookings);
router.get('/payments', userController.payments);

module.exports = router;
