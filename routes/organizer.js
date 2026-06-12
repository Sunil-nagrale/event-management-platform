const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const eventController = require('../controllers/eventController');
const { ensureOrganizer } = require('../middleware/roles');

router.use(ensureOrganizer);

router.get('/', organizerController.dashboard);
router.get('/events', organizerController.events);
router.get('/events/:eventId/registrations', organizerController.registrations);
router.get('/revenue', organizerController.revenue);

module.exports = router;
