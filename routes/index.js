const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');

// Home Page
router.get('/', (req, res) => {
  res.render('index', { title: 'Todo App' });
});

// Auth Routes
router.use('/auth', authRoutes);

// Task Routes
router.use('/tasks', taskRoutes);

module.exports = router;