const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Login Page
router.get('/login', authMiddleware.forwardAuthenticated, (req, res) => {
  res.render('auth/login');
});

// Login Handle
router.post(
  '/login',
  [
    check('email', 'Email is required').notEmpty().isEmail(),
    check('password', 'Password is required').notEmpty()
  ],
  authController.login
);

// Register Page
router.get('/register', authMiddleware.forwardAuthenticated, (req, res) => {
  res.render('auth/register');
});

// Register Handle
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is required').notEmpty().isLength({ min: 2 }),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  authController.register
);

// Logout Handle
router.get('/logout', authController.logout);

module.exports = router;