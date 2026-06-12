const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { paginate, formatCurrency } = require('../utils/helpers');

exports.dashboard = async (req, res, next) => {
  try {
    const [bookingsCount, paymentsCount, upcomingBookings] = await Promise.all([
      Booking.countDocuments({ user: req.user._id, status: 'confirmed' }),
      Payment.countDocuments({ user: req.user._id, status: 'paid' }),
      Booking.find({ user: req.user._id, status: 'confirmed' })
        .populate('event')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const upcoming = upcomingBookings.filter(
      (b) => b.event && new Date(b.event.dateTime.start) >= new Date()
    );

    res.render('user/dashboard', {
      title: 'My Dashboard',
      layout: 'layouts/main',
      stats: { bookingsCount, paymentsCount },
      upcomingBookings: upcoming
    });
  } catch (error) {
    next(error);
  }
};

exports.profile = (req, res) => {
  res.render('user/profile', {
    title: 'My Profile',
    layout: 'layouts/main',
    user: req.user
  });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.phone = req.body.phone || '';
    user.bio = req.body.bio || '';

    await user.save();

    req.flash('success', 'Profile updated successfully.');
    res.redirect('/user/profile');
  } catch (error) {
    next(error);
  }
};

exports.bookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const filter = { user: req.user._id };

    if (req.query.status) filter.status = req.query.status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('event')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('user/bookings', {
      title: 'My Bookings',
      layout: 'layouts/main',
      bookings,
      pagination: paginate(page, Math.ceil(total / limit))
    });
  } catch (error) {
    next(error);
  }
};

exports.payments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const total = await Payment.countDocuments({ user: req.user._id });

    const payments = await Payment.find({ user: req.user._id })
      .populate('event', 'title dateTime location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('user/payments', {
      title: 'Payment History',
      layout: 'layouts/main',
      payments,
      pagination: paginate(page, Math.ceil(total / limit)),
      formatCurrency
    });
  } catch (error) {
    next(error);
  }
};
