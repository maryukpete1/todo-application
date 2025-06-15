const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const logger = require('../../config/winston');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User');

function createTestApp(mongoUri) {
  const testApp = express();

  // Set up view engine
  testApp.set('view engine', 'ejs');
  testApp.set('views', path.join(__dirname, '../../views'));

  // Session configuration for testing
  const sessionConfig = {
    secret: 'test-secret',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      ttl: 14 * 24 * 60 * 60, // = 14 days
      autoRemove: 'native'
    }),
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for testing
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
  };

  // Apply middleware in correct order
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: true }));
  testApp.use(session(sessionConfig));
  testApp.use(flash());
  testApp.use(passport.initialize());
  testApp.use(passport.session());

  // Configure Passport
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Global variables middleware
  testApp.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

  // Mount routes
  testApp.use('/', require('../../routes/index'));
  testApp.use('/auth', require('../../routes/authRoutes'));
  testApp.use('/tasks', require('../../routes/taskRoutes'));

  // Error handling
  testApp.use((err, req, res, next) => {
    logger.error('Test app error:', err);
    
    // Handle authentication errors
    if (err.name === 'AuthenticationError') {
      req.flash('error_msg', err.message);
      return res.redirect('/auth/login');
    }

    // Handle session errors
    if (err.message === 'req.flash() requires sessions') {
      return res.redirect('/auth/login');
    }

    // Handle other errors
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    } else {
      res.status(err.status || 500).render('error', {
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
      });
    }
  });

  return testApp;
}

module.exports = createTestApp; 