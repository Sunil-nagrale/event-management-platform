const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg);
    req.flash('error', errorMessages.join('. '));
    req.validationErrors = errors.array();

    const redirectTo = req.body._redirect || req.get('Referer') || '/';
    return res.redirect(redirectTo);
  }

  next();
};

module.exports = { validate };
