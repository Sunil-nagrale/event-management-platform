const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { ensureOrganizer, ensureEventOwnerOrAdmin } = require('../middleware/roles');
const { upload, handleUploadError } = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { eventValidation } = require('../middleware/validators');
const { validateObjectId } = require('../middleware/objectId');

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
router.get('/:id', validateObjectId(), eventController.show);
router.get('/:id/edit', validateObjectId(), ensureEventOwnerOrAdmin, eventController.editForm);
router.put(
  '/:id',
  validateObjectId(),
  ensureEventOwnerOrAdmin,
  upload.single('image'),
  handleUploadError,
  eventValidation,
  validate,
  eventController.update
);
router.delete('/:id', validateObjectId(), ensureEventOwnerOrAdmin, eventController.delete);

module.exports = router;
