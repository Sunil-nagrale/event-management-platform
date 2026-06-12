const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/roles');

router.use(ensureAdmin);

router.get('/', adminController.dashboard);
router.get('/users', adminController.users);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/events', adminController.events);
router.get('/registrations', adminController.registrations);

module.exports = router;
