const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'organizer', 'attendee'],
      default: 'attendee'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  errorMessages: {
    UserExistsError: 'An account with this email already exists.',
    MissingPasswordError: 'Password is required.',
    AttemptTooSoonError: 'Account is locked. Try again later.',
    TooManyAttemptsError: 'Too many failed login attempts.',
    NoSaltValueStoredError: 'Authentication not possible.',
    IncorrectPasswordError: 'Incorrect password.',
    IncorrectUsernameError: 'No account found with this email.'
  }
});

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
