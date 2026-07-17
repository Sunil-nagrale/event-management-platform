const Event = require('../models/Event');
const Booking = require('../models/Booking');
const cloudinary = require('../config/cloudinary');
const { paginate, getCategoryLabel } = require('../utils/helpers');

const ITEMS_PER_PAGE = 9;

exports.index = async (req, res, next) => {
  try {
    const featuredEvents = await Event.find({ status: 'published', 'dateTime.start': { $gte: new Date() } })
      .populate('organizer', 'firstName lastName')
      .sort({ 'dateTime.start': 1 })
      .limit(6);

    const stats = {
      events: await Event.countDocuments({ status: 'published' }),
      bookings: await Booking.countDocuments({ status: 'confirmed' }),
      users: await require('../models/User').countDocuments()
    };

    res.render('pages/home', {
      title: 'EventHub - Discover Amazing Events',
      layout: 'layouts/main',
      featuredEvents,
      stats
    });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const { search, category, status, sort, city, minPrice, maxPrice } = req.query;

    const filter = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { 'location.city': regex }];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = { $in: ['published', 'completed'] };
    if (city) filter['location.city'] = new RegExp(city, 'i');

    if (minPrice || maxPrice) {
      filter.ticketPrice = {};
      if (minPrice) filter.ticketPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.ticketPrice.$lte = parseFloat(maxPrice);
    }

    let sortOption = { 'dateTime.start': 1 };
    if (sort === 'date-desc') sortOption = { 'dateTime.start': -1 };
    if (sort === 'price-asc') sortOption = { ticketPrice: 1 };
    if (sort === 'price-desc') sortOption = { ticketPrice: -1 };
    if (sort === 'title') sortOption = { title: 1 };

    const total = await Event.countDocuments(filter);
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName')
      .sort(sortOption)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('events/index', {
      title: 'Browse Events',
      layout: 'layouts/main',
      events,
      pagination: paginate(page, totalPages),
      query: req.query,
      categories: Event.schema.path('category').enumValues,
      getCategoryLabel
    });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'firstName lastName email');

    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    let userBooking = null;
    if (req.user) {
      userBooking = await Booking.findOne({
        user: req.user._id,
        event: event._id,
        status: { $ne: 'cancelled' }
      });
    }

    res.render('events/show', {
      title: event.title,
      layout: 'layouts/main',
      event,
      userBooking,
      getCategoryLabel
    });
  } catch (error) {
    next(error);
  }
};

exports.newForm = (req, res) => {
  res.render('events/new', {
    title: 'Create Event',
    layout: 'layouts/main',
    categories: Event.schema.path('category').enumValues,
    getCategoryLabel
  });
};

exports.create = async (req, res, next) => {
  try {
    const eventData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: {
        venue: req.body.venue,
        city: req.body.city,
        address: req.body.address || ''
      },
      dateTime: {
        start: new Date(req.body.startDate),
        end: new Date(req.body.endDate)
      },
      capacity: parseInt(req.body.capacity, 10),
      ticketPrice: parseFloat(req.body.ticketPrice) || 0,
      status: req.body.status || 'published',
      organizer: req.user._id,
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    };

    if (req.file && process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'event-platform', resource_type: 'image' },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      eventData.image = { url: result.secure_url, publicId: result.public_id };
    }

    const event = await Event.create(eventData);
    req.flash('success', 'Event created successfully!');
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    next(error);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const event = req.event || (await Event.findById(req.params.id));
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    res.render('events/edit', {
      title: 'Edit Event',
      layout: 'layouts/main',
      event,
      categories: Event.schema.path('category').enumValues,
      getCategoryLabel
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const event = req.event || (await Event.findById(req.params.id));
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    event.title = req.body.title;
    event.description = req.body.description;
    event.category = req.body.category;
    event.location = {
      venue: req.body.venue,
      city: req.body.city,
      address: req.body.address || ''
    };
    event.dateTime = {
      start: new Date(req.body.startDate),
      end: new Date(req.body.endDate)
    };
    event.capacity = parseInt(req.body.capacity, 10);
    event.ticketPrice = parseFloat(req.body.ticketPrice) || 0;
    event.status = req.body.status;
    event.tags = req.body.tags ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    if (req.file && process.env.CLOUDINARY_CLOUD_NAME) {
      if (event.image.publicId) {
        await cloudinary.uploader.destroy(event.image.publicId);
      }
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'event-platform', resource_type: 'image' },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      event.image = { url: result.secure_url, publicId: result.public_id };
    }

    await event.save();
    req.flash('success', 'Event updated successfully!');
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const event = req.event || (await Event.findById(req.params.id));
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.image.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      await cloudinary.uploader.destroy(event.image.publicId).catch(console.error);
    }

    await Booking.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(event._id);

    req.flash('success', 'Event deleted successfully.');
    res.redirect(req.user.role === 'admin' ? '/admin/events' : '/organizer/events');
  } catch (error) {
    next(error);
  }
};
