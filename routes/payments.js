const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/checkout/:eventId', paymentController.checkout);
router.post('/create-order/:eventId', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/success/:bookingId', paymentController.success);
router.get('/failure', paymentController.failure);

module.exports = router;
