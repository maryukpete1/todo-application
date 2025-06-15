const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const routes = require('../routes');
const mongoose = require('mongoose');

// Create express app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware factory
const createSessionMiddleware = (mongoUri) => {
  const store = MongoStore.create({
    mongoUrl: mongoUri,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native',
    touchAfter: 24 * 3600
  });

  return session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
      httpOnly: true,
      secure: false, // Set to false for testing
      sameSite: 'lax'
    }
  });
};

// Flash messages
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = { app, createSessionMiddleware }; 