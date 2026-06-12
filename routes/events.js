const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { ensureOrganizer, ensureEventOwnerOrAdmin } = require('../middleware/roles');
const { upload, handleUploadError } = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { eventValidation } = require('../middleware/validators');

router.get('/', eventController.list);
router.get('/new', ensureOrganizer, eventController.newForm);
router.post(
  '/',
  ensureOrganizer,
  upload.single('image'),
  handleUploadError,
  eventValidation,
  validate,
  eventController.create
);
router.get('/:id', eventController.show);
router.get('/:id/edit', ensureEventOwnerOrAdmin, eventController.editForm);
router.put(
  '/:id',
  ensureEventOwnerOrAdmin,
  upload.single('image'),
  handleUploadError,
  eventValidation,
  validate,
  eventController.update
);
router.delete('/:id', ensureEventOwnerOrAdmin, eventController.delete);

module.exports = router;
