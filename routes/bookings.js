const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/', bookingController.list);
router.get('/:id', bookingController.show);
router.post('/events/:eventId', bookingController.create);
router.delete('/:id', bookingController.cancel);

module.exports = router;
