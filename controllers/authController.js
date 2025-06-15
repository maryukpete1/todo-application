const passport = require('passport');
const User = require('../models/User');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors.array()[0].msg;
      logger.warn(`Registration validation failed: ${errorMsg}`);
      req.flash('error_msg', errorMsg);
      return res.redirect('/auth/register');
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      req.flash('error_msg', 'Email already exists');
      return res.redirect('/auth/register');
    }

    // Create new user
    user = new User({
      email: email.toLowerCase(),
      password,
      name
    });

    await user.save();
    logger.info(`New user registered successfully: ${email}`);
    req.flash('success_msg', 'Registration successful! You can now log in.');
    return res.redirect('/auth/login');
  } catch (err) {
    logger.error('Registration error:', err);
    req.flash('error_msg', 'An error occurred during registration');
    return res.redirect('/auth/register');
  }
};

exports.login = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors.array()[0].msg;
      logger.warn(`Login validation failed: ${errorMsg}`);
      req.flash('error_msg', errorMsg);
      return res.redirect('/auth/login');
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) {
        logger.error('Login authentication error:', err);
        req.flash('error_msg', 'An error occurred during login');
        return next(err);
      }

      if (!user) {
        logger.warn(`Login failed for email: ${req.body.email}`);
        req.flash('error_msg', info.message || 'Invalid email or password');
        return res.redirect('/auth/login');
      }

      req.logIn(user, (err) => {
        if (err) {
          logger.error('Login session error:', err);
          req.flash('error_msg', 'An error occurred during login');
          return next(err);
        }

        logger.info(`User logged in successfully: ${user.email}`);
        req.flash('success_msg', 'Welcome back!');
        return res.redirect('/tasks');
      });
    })(req, res, next);
  } catch (err) {
    logger.error('Login error:', err);
    req.flash('error_msg', 'An error occurred during login');
    return res.redirect('/auth/login');
  }
};

exports.logout = (req, res, next) => {
  const userEmail = req.user ? req.user.email : 'unknown';
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      req.flash('error_msg', 'An error occurred during logout');
      return next(err);
    }
    logger.info(`User logged out: ${userEmail}`);
    req.flash('success_msg', 'You have been logged out successfully');
    res.redirect('/');
  });
};