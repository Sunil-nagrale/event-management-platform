const { isAuthenticated, hasRole } = require('./auth');

const ensureAuthenticated = isAuthenticated;

const ensureAdmin = [isAuthenticated, hasRole('admin')];
const ensureOrganizer = [isAuthenticated, hasRole('organizer', 'admin')];
const ensureAttendee = [isAuthenticated, hasRole('attendee', 'organizer', 'admin')];

const ensureEventOwnerOrAdmin = async (req, res, next) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      req.flash('error', 'You do not have permission to modify this event.');
      return res.redirect('/events');
    }

    req.event = event;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureOrganizer,
  ensureAttendee,
  ensureEventOwnerOrAdmin
};
