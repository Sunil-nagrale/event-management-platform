const { body } = require('express-validator');

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  })
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('category').notEmpty().withMessage('Category is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.startDate)) {
      throw new Error('End date must be after start date');
    }
    return true;
  }),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('ticketPrice').isFloat({ min: 0 }).withMessage('Ticket price must be 0 or greater')
];

const profileValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().trim(),
  body('bio').optional().trim().isLength({ max: 500 })
];

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 })
];

module.exports = {
  registerValidation,
  loginValidation,
  eventValidation,
  profileValidation,
  contactValidation
};
