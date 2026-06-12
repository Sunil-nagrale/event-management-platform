const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const eventController = require('../controllers/eventController');
const { validate } = require('../middleware/validation');
const { contactValidation } = require('../middleware/validators');

router.get('/', eventController.index);
router.get('/about', pageController.about);
router.get('/contact', pageController.contact);
router.post('/contact', contactValidation, validate, pageController.contactSubmit);

module.exports = router;
