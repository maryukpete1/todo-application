const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const methodOverride = require('method-override');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/winston');
const errorHandler = require('./middlewares/errorMiddleware');
const routes = require('./routes');

const app = express();

// Passport config
require('./config/passport')(passport);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native',
    touchAfter: 24 * 3600,
    crypto: {
      secret: process.env.SESSION_SECRET || 'your-secret-key'
    },
    // Add error handling for store
    onError: function(err) {
      logger.error('Session store error:', err);
    }
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  },
  name: 'sessionId',
  rolling: true, // Refresh session on activity
  proxy: process.env.NODE_ENV === 'production' // Trust reverse proxy in production
};

// Log session configuration in development
if (process.env.NODE_ENV === 'development') {
  logger.info('Session configuration:', {
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    proxy: sessionConfig.proxy
  });
}

app.use(session(sessionConfig));

// Flash messages - must be after session
app.use(flash());

// Passport middleware - must be after session and flash
app.use(passport.initialize());
app.use(passport.session());

// Global variables - must be after session, flash, and passport
app.use((req, res, next) => {
  // Make user available to all views
  res.locals.user = req.user || null;
  
  // Make flash messages available to all views
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  
  // Add session info to locals for debugging
  if (process.env.NODE_ENV === 'development') {
    res.locals.session = {
      id: req.sessionID,
      cookie: req.session.cookie,
      user: req.user ? req.user.email : null
    };
  }
  
  // Log session state for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Session state:', {
      id: req.sessionID,
      authenticated: req.isAuthenticated(),
      user: req.user ? req.user.email : null
    });
  }
  
  next();
});

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('errors/404');
});

// Error handler
app.use(errorHandler.errorHandler);

module.exports = app;