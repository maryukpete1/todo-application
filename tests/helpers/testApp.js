const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const User = require('../../models/User');
const logger = require('../../config/winston');

function createTestApp(mongoUri) {
  const app = express();

  // Body parser
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Session configuration
  app.use(session({
    secret: 'test-secret',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      ttl: 24 * 60 * 60 // 1 day for tests
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    }
  }));

  // Flash messages
  app.use(flash());

  // Global variables
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
  });

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
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

  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Remove password from user object
        user.password = undefined;
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Routes
  app.use('/', require('../../routes'));

  // Error handler
  app.use((err, req, res, next) => {
    logger.error('Test app error:', err);
    if (req.xhr || req.headers.accept.includes('json')) {
      res.status(500).json({ error: err.message });
    } else {
      req.flash('error_msg', 'An error occurred');
      res.redirect('/auth/login');
    }
  });

  return app;
}

module.exports = createTestApp; 