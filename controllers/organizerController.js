const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { paginate, formatCurrency } = require('../utils/helpers');

exports.dashboard = async (req, res, next) => {
  try {
    const organizerId = req.user._id;

    const [myEvents, totalRegistrations, revenueResult] = await Promise.all([
      Event.countDocuments({ organizer: organizerId }),
      Booking.countDocuments({
        status: 'confirmed',
        event: { $in: await Event.find({ organizer: organizerId }).distinct('_id') }
      }),
      Payment.aggregate([
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'eventData'
          }
        },
        { $unwind: '$eventData' },
        { $match: { 'eventData.organizer': organizerId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const upcomingEvents = await Event.find({
      organizer: organizerId,
      'dateTime.start': { $gte: new Date() },
      status: 'published'
    })
      .sort({ 'dateTime.start': 1 })
      .limit(5);

    const recentRegistrations = await Booking.find({ status: 'confirmed' })
      .populate({
        path: 'event',
        match: { organizer: organizerId },
        select: 'title'
      })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    const filteredRegistrations = recentRegistrations.filter((b) => b.event);

    res.render('organizer/dashboard', {
      title: 'Organizer Dashboard',
      layout: 'layouts/dashboard',
      stats: {
        myEvents,
        totalRegistrations,
        totalRevenue: revenueResult[0]?.total || 0
      },
      upcomingEvents,
      recentRegistrations: filteredRegistrations,
      formatCurrency
    });
  } catch (error) {
    next(error);
  }
};

exports.events = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const filter = { organizer: req.user._id };

    if (req.query.status) filter.status = req.query.status;

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('organizer/events', {
      title: 'My Events',
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
    const event = await Event.findOne({ _id: req.params.eventId, organizer: req.user._id });

    if (!event && req.user.role !== 'admin') {
      req.flash('error', 'Event not found or access denied.');
      return res.redirect('/organizer/events');
    }

    const targetEvent = event || (await Event.findById(req.params.eventId));

    const bookings = await Booking.find({ event: targetEvent._id, status: 'confirmed' })
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.render('organizer/registrations', {
      title: `Registrations - ${targetEvent.title}`,
      layout: 'layouts/dashboard',
      event: targetEvent,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

exports.revenue = async (req, res, next) => {
  try {
    const eventIds = await Event.find({ organizer: req.user._id }).distinct('_id');

    const payments = await Payment.find({
      event: { $in: eventIds },
      status: 'paid'
    })
      .populate('event', 'title')
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const byEvent = await Payment.aggregate([
      { $match: { event: { $in: eventIds }, status: 'paid' } },
      { $group: { _id: '$event', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      { $sort: { revenue: -1 } }
    ]);

    res.render('organizer/revenue', {
      title: 'Revenue Statistics',
      layout: 'layouts/dashboard',
      payments,
      totalRevenue,
      byEvent,
      formatCurrency
    });
  } catch (error) {
    next(error);
  }
};
