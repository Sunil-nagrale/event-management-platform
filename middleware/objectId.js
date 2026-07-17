const mongoose = require('mongoose');

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) &&
  new mongoose.Types.ObjectId(id).toString() === id.toString();

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!isValidObjectId(id)) {
    req.flash('error', 'Invalid resource ID.');
    return res.redirect('/events');
  }
  next();
};

module.exports = { isValidObjectId, validateObjectId };
