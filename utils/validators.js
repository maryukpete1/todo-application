const { check } = require('express-validator');
const User = require('../models/User');

exports.registerValidator = [
  check('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .custom(async (username) => {
      const user = await User.findOne({ username });
      if (user) {
        throw new Error('Username already in use');
      }
    }),
  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidator = [
  check('username').notEmpty().withMessage('Username is required'),
  check('password').notEmpty().withMessage('Password is required'),
];

exports.taskValidator = [
  check('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  check('description')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
];