const { check } = require('express-validator');
const User = require('../models/User');

exports.registerValidator = [
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .custom(async (email) => {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        throw new Error('Email already in use');
      }
    }),
  check('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidator = [
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  check('password')
    .notEmpty().withMessage('Password is required'),
];

exports.taskValidator = [
  check('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  check('description')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
];