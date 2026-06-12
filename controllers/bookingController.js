const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendRegistrationConfirmation } = require('../utils/email');

exports.create = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.status !== 'published') {
      req.flash('error', 'This event is not available for registration.');
      return res.redirect(`/events/${event._id}`);
    }

    if (event.registeredCount >= event.capacity) {
      req.flash('error', 'Sorry, this event is fully booked.');
      return res.redirect(`/events/${event._id}`);
    }

    const existing = await Booking.findOne({
      user: req.user._id,
      event: event._id,
      status: { $ne: 'cancelled' }
    });

    if (existing) {
      req.flash('info', 'You are already registered for this event.');
      return res.redirect(`/events/${event._id}`);
    }

    if (event.ticketPrice > 0) {
      return res.redirect(`/payments/checkout/${event._id}`);
    }

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      status: 'confirmed',
      amount: 0
    });

    event.registeredCount += 1;
    await event.save();

    sendRegistrationConfirmation(req.user, event, booking).catch(console.error);

    req.flash('success', `Successfully registered! Your ticket number is ${booking.ticketNumber}.`);
    res.redirect('/user/bookings');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('info', 'You are already registered for this event.');
      return res.redirect(`/events/${req.params.eventId}`);
    }
    next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('event');

    if (!booking) {
      req.flash('error', 'Booking not found.');
      return res.redirect('/user/bookings');
    }

    if (booking.status === 'cancelled') {
      req.flash('info', 'This booking is already cancelled.');
      return res.redirect('/user/bookings');
    }

    booking.status = 'cancelled';
    await booking.save();

    if (booking.event) {
      booking.event.registeredCount = Math.max(0, booking.event.registeredCount - 1);
      await booking.event.save();
    }

    req.flash('success', 'Registration cancelled successfully.');
    res.redirect('/user/bookings');
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const filter = { user: req.user._id };

    if (req.query.status) filter.status = req.query.status;

    const total = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const bookings = await Booking.find(filter)
      .populate('event')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('user/bookings', {
      title: 'My Bookings',
      layout: 'layouts/main',
      bookings,
      pagination: require('../utils/helpers').paginate(page, totalPages)
    });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('event')
      .populate('payment');

    if (!booking) {
      req.flash('error', 'Booking not found.');
      return res.redirect('/user/bookings');
    }

    res.render('user/booking-detail', {
      title: 'Booking Details',
      layout: 'layouts/main',
      booking
    });
  } catch (error) {
    next(error);
  }
};
