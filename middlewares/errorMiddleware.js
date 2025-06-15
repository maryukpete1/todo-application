const logger = require('../config/winston');

exports.errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log the error with more details
  logger.error({
    statusCode,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.email : 'anonymous'
  });
  
  // Handle specific error types
  if (err.name === 'AuthenticationError') {
    req.flash('error_msg', 'Authentication failed. Please try again.');
    return res.redirect('/auth/login');
  }

  if (err.name === 'SessionError') {
    req.flash('error_msg', 'Session error. Please log in again.');
    return res.redirect('/auth/login');
  }

  // Handle different response types
  if (req.accepts('html')) {
    // For HTML requests, render error page
    res.status(statusCode).render('errors/500', {
      status: statusCode,
      message: statusCode === 404 ? 'Page not found' : 'Something went wrong',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  } else if (req.accepts('json')) {
    // For API requests, send JSON response
    res.status(statusCode).json({
      error: {
        status: statusCode,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  } else {
    // For other requests, send plain text
    res.status(statusCode).send(`${statusCode} - ${err.message}`);
  }
};