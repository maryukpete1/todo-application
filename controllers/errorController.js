const logger = require('../config/winston');

exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

exports.errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (req.accepts('html')) {
    res.status(statusCode).render('errors/500', {
      status: statusCode,
      message: statusCode === 404 ? 'Page not found' : 'Something went wrong',
    });
  } else if (req.accepts('json')) {
    res.status(statusCode).json({
      error: {
        status: statusCode,
        message: err.message,
      },
    });
  } else {
    res.status(statusCode).send(`${statusCode} - ${err.message}`);
  }
};