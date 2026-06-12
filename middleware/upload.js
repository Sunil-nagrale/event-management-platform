const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.flash('error', err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5MB.' : err.message);
    return res.redirect(req.get('Referer') || '/');
  }
  if (err) {
    req.flash('error', err.message);
    return res.redirect(req.get('Referer') || '/');
  }
  next();
};

module.exports = { upload, handleUploadError };
