console.log('[Passport] Starting passport configuration...');

const passport = require('passport');
console.log('[Passport] Passport module loaded');

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('./winston');
console.log('[Passport] Dependencies loaded');

console.log('[Passport] Configuring LocalStrategy...');
module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { 
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          // Find user and explicitly select password field
          const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
          
          if (!user) {
            logger.warn(`Login attempt failed: User not found - ${email}`);
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Compare password
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            logger.warn(`Login attempt failed: Invalid password - ${email}`);
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Remove password from user object before returning
          const userWithoutPassword = user.toObject();
          delete userWithoutPassword.password;
          
          logger.info(`User authenticated successfully: ${email}`);
          return done(null, userWithoutPassword);
        } catch (err) {
          logger.error('Passport authentication error:', err);
          return done(err);
        }
      }
    )
  );
  console.log('[Passport] LocalStrategy configured');

  console.log('[Passport] Configuring serialization...');
  passport.serializeUser((user, done) => {
    try {
      done(null, user._id);
    } catch (err) {
      logger.error('Passport serialization error:', err);
      done(err);
    }
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        logger.warn(`User not found during deserialization: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      logger.error('Passport deserialization error:', err);
      done(err);
    }
  });
  console.log('[Passport] Serialization configured');

  console.log('[Passport] Configuration complete');
};