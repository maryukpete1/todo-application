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
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  console.log('[Passport] LocalStrategy configured');

  console.log('[Passport] Configuring serialization...');
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
  console.log('[Passport] Serialization configured');

  console.log('[Passport] Configuration complete');
};