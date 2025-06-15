const logger = require('../config/winston');

exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  logger.warn(`Unauthorized access attempt to ${req.originalUrl}`);
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/auth/login');
};

exports.forwardAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/tasks');
};