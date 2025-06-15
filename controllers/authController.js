const passport = require('passport');
const User = require('../models/User');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect('/register');
  }

  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) {
      req.flash('error_msg', 'Username already exists');
      return res.redirect('/register');
    }

    user = new User({ username, password });
    await user.save();

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/login');
    logger.info(`New user registered: ${username}`);
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
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error('Login authentication error:', err);
      req.flash('error_msg', 'An error occurred during login');
      return next(err);
    }
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid username or password');
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        logger.error('Login session error:', err);
        req.flash('error_msg', 'An error occurred during login');
        return next(err);
      }
      logger.info(`User ${user.username} logged in successfully`);
      req.flash('success_msg', 'Welcome back!');
      return res.redirect('/tasks');
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
  });
};