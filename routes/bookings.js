const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/objectId');

router.use(ensureAuthenticated);

router.get('/', bookingController.list);
router.get('/:id', validateObjectId(), bookingController.show);
router.post('/events/:eventId', validateObjectId('eventId'), bookingController.create);
router.delete('/:id', validateObjectId(), bookingController.cancel);

module.exports = router;
