const mongoose = require('mongoose');
const crypto = require('crypto');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    },
    ticketNumber: {
      type: String,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, event: 1 }, { unique: true });

bookingSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber = `TKT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
