const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { paginate, formatCurrency } = require('../utils/helpers');

exports.dashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalEvents, totalRegistrations, revenueResult] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentBookings = await Booking.find({ status: 'confirmed' })
      .populate('user', 'firstName lastName email')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/dashboard',
      stats: { totalUsers, totalEvents, totalRegistrations, totalRevenue },
      eventsByCategory,
      recentBookings,
      monthlyRevenue,
      formatCurrency
    });
  } catch (error) {
    next(error);
  }
};

exports.users = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 15;
    const filter = {};

    if (req.query.search) {
      filter.$or = [
        { firstName: new RegExp(req.query.search, 'i') },
        { lastName: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }
    if (req.query.role) filter.role = req.query.role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('admin/users', {
      title: 'User Management',
      layout: 'layouts/dashboard',
      users,
      pagination: paginate(page, Math.ceil(total / limit)),
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    if (user._id.toString() === req.user._id.toString()) {
      req.flash('error', 'You cannot change your own role.');
      return res.redirect('/admin/users');
    }

    user.role = role;
    await user.save();

    req.flash('success', `User role updated to ${role}.`);
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    if (user._id.toString() === req.user._id.toString()) {
      req.flash('error', 'You cannot delete your own account.');
      return res.redirect('/admin/users');
    }

    await Booking.deleteMany({ user: user._id });
    await Payment.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    req.flash('success', 'User deleted successfully.');
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
};

exports.events = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 15;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.title = new RegExp(req.query.search, 'i');

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('admin/events', {
      title: 'Event Management',
      layout: 'layouts/dashboard',
      events,
      pagination: paginate(page, Math.ceil(total / limit)),
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};

exports.registrations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 15;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('event', 'title dateTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('admin/registrations', {
      title: 'Registration Management',
      layout: 'layouts/dashboard',
      bookings,
      pagination: paginate(page, Math.ceil(total / limit)),
      query: req.query
    });
  } catch (error) {
    next(error);
  }
};
