const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/objectId');

router.use(ensureAuthenticated);

router.get('/checkout/:eventId', validateObjectId('eventId'), paymentController.checkout);
router.post('/create-order/:eventId', validateObjectId('eventId'), paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/mock-pay', paymentController.mockPayment);
router.get('/success/:bookingId', validateObjectId('bookingId'), paymentController.success);
router.get('/failure', paymentController.failure);

module.exports = router;
