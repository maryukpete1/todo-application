const logger = require('../config/winston');

exports.formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

exports.handleError = (error, req, res, next) => {
  logger.error(error.message, error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: error.message,
        details: error.errors,
      },
    });
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    return res.status(400).json({
      error: {
        message: 'Duplicate key error',
        details: error.keyValue,
      },
    });
  }

  next(error);
};

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};