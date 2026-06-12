const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['technology', 'cultural', 'workshop', 'concert', 'hackathon', 'sports', 'networking', 'other']
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    location: {
      venue: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      address: { type: String, default: '' }
    },
    dateTime: {
      start: { type: Date, required: [true, 'Start date is required'] },
      end: { type: Date, required: [true, 'End date is required'] }
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'published'
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });
eventSchema.index({ category: 1, status: 1, 'dateTime.start': 1 });

eventSchema.virtual('availableSeats').get(function () {
  return Math.max(0, this.capacity - this.registeredCount);
});

eventSchema.virtual('isFull').get(function () {
  return this.registeredCount >= this.capacity;
});

eventSchema.virtual('isFree').get(function () {
  return this.ticketPrice === 0;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
