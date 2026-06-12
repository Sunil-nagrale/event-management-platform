const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendRegistrationConfirmation, sendTicketConfirmation } = require('../utils/email');

exports.checkout = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.ticketPrice <= 0) {
      return res.redirect(`/bookings/events/${event._id}`);
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

    res.render('payments/checkout', {
      title: 'Checkout',
      layout: 'layouts/main',
      event,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is fully booked' });
    }

    const amountInPaise = Math.round(event.ticketPrice * 100);
    const receipt = `rcpt_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        eventId: event._id.toString(),
        userId: req.user._id.toString()
      }
    });

    const payment = await Payment.create({
      user: req.user._id,
      event: event._id,
      razorpayOrderId: order.id,
      amount: event.ticketPrice,
      receipt,
      status: 'created'
    });

    res.json({
      success: true,
      order,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Unable to create payment order' });
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      req.flash('error', 'Payment record not found.');
      return res.redirect('/payments/failure');
    }

    if (expectedSignature !== razorpay_signature) {
      payment.status = 'failed';
      await payment.save();
      req.flash('error', 'Payment verification failed.');
      return res.redirect('/payments/failure');
    }

    const event = await Event.findById(payment.event);
    if (!event || event.registeredCount >= event.capacity) {
      payment.status = 'failed';
      await payment.save();
      req.flash('error', 'Event is no longer available.');
      return res.redirect('/payments/failure');
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      status: 'confirmed',
      amount: payment.amount,
      payment: payment._id
    });

    payment.booking = booking._id;
    await payment.save();

    event.registeredCount += 1;
    await event.save();

    sendTicketConfirmation(req.user, event, booking, payment).catch(console.error);

    req.flash('success', `Payment successful! Ticket: ${booking.ticketNumber}`);
    res.redirect(`/payments/success/${booking._id}`);
  } catch (error) {
    console.error('Verify payment error:', error);
    req.flash('error', 'Payment processing failed.');
    res.redirect('/payments/failure');
  }
};

exports.success = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id
    })
      .populate('event')
      .populate('payment');

    if (!booking) {
      req.flash('error', 'Booking not found.');
      return res.redirect('/user/bookings');
    }

    res.render('payments/success', {
      title: 'Payment Successful',
      layout: 'layouts/main',
      booking
    });
  } catch (error) {
    next(error);
  }
};

exports.failure = (req, res) => {
  res.render('payments/failure', {
    title: 'Payment Failed',
    layout: 'layouts/main'
  });
};

exports.history = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const total = await Payment.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(total / limit);

    const payments = await Payment.find({ user: req.user._id })
      .populate('event', 'title dateTime location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('user/payments', {
      title: 'Payment History',
      layout: 'layouts/main',
      payments,
      pagination: require('../utils/helpers').paginate(page, totalPages)
    });
  } catch (error) {
    next(error);
  }
};
