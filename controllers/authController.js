const passport = require('passport');
const User = require('../models/User');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect('/auth/register');
  }

  const { email, password, name } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      req.flash('error_msg', 'Email already exists');
      return res.redirect('/auth/register');
    }

    user = new User({ email, password, name });
    await user.save();

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
    logger.info(`New user registered: ${email}`);
  } catch (err) {
    logger.error('Registration error:', err);
    next(err);
  }
};

exports.login = (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect('/auth/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error('Login authentication error:', err);
      req.flash('error_msg', 'An error occurred during login');
      return next(err);
    }
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        logger.error('Login session error:', err);
        req.flash('error_msg', 'An error occurred during login');
        return next(err);
      }

      logger.info(`User ${user.email} logged in successfully`);
      req.flash('success_msg', 'Welcome back!');
      return res.redirect('/tasks');
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
};