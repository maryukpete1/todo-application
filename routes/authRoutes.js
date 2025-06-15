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
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').notEmpty(),
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
    check('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  authController.register
);

// Logout Handle
router.get('/logout', authController.logout);

module.exports = router;