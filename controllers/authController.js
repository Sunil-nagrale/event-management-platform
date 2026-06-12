const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const { generateToken } = require('../utils/helpers');
const passport = require('../config/passport');

exports.showRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Sign Up',
    layout: 'layouts/main'
  });
};

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const allowedRole = role === 'organizer' ? 'organizer' : 'attendee';

    const user = new User({ firstName, lastName, email, role: allowedRole });
    const registeredUser = await User.register(user, password);

    sendWelcomeEmail(registeredUser).catch(console.error);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash('success', 'Welcome to EventHub! Your account has been created.');
      res.redirect('/');
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/auth/register');
  }
};

exports.showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    layout: 'layouts/main',
    returnTo: req.session.returnTo || '/'
  });
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info?.message || 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      req.flash('success', `Welcome back, ${user.firstName}!`);
      const redirectTo = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(redirectTo);
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been logged out.');
    res.redirect('/');
  });
};

exports.showForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    layout: 'layouts/main'
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      req.flash('info', 'If an account exists with that email, a reset link has been sent.');
      return res.redirect('/auth/login');
    }

    const token = generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${token}`;
    await sendPasswordResetEmail(user, resetUrl);

    req.flash('success', 'Password reset link sent to your email.');
    res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', 'Unable to process password reset. Please try again.');
    res.redirect('/auth/forgot-password');
  }
};

exports.showResetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset link is invalid or has expired.');
    return res.redirect('/auth/forgot-password');
  }

  res.render('auth/reset-password', {
    title: 'Reset Password',
    layout: 'layouts/main',
    token: req.params.token
  });
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset link is invalid or has expired.');
      return res.redirect('/auth/forgot-password');
    }

    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('success', 'Password updated successfully. Please log in.');
    res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/auth/reset-password/${req.params.token}`);
  }
};
