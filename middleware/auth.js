const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/auth/login');
};

const isGuest = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  req.flash('info', 'You are already logged in.');
  res.redirect('/');
};

const hasRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/auth/login');
  }

  if (!roles.includes(req.user.role)) {
    req.flash('error', 'You do not have permission to access this page.');
    return res.redirect('/');
  }

  next();
};

module.exports = { isAuthenticated, isGuest, hasRole, ensureAuthenticated: isAuthenticated };
