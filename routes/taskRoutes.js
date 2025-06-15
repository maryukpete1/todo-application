const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Ensure all task routes are authenticated
router.use(authMiddleware.ensureAuthenticated);

// Get all tasks
router.get('/', taskController.getAllTasks);

// Show create task form
router.get('/new', taskController.showCreateForm);

// Create new task
router.post(
  '/',
  [
    check('title', 'Title is required').notEmpty(),
    check('title', 'Title must be less than 100 characters').isLength({ max: 100 }),
    check('description', 'Description must be less than 500 characters').isLength({ max: 500 }),
  ],
  taskController.createTask
);

// Update task status
router.put('/:id/status', taskController.updateTaskStatus);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Add these routes to the existing taskRoutes.js

// Show edit task form
router.get('/:id/edit', taskController.showEditForm);

// Update task
router.put(
  '/:id',
  [
    check('title', 'Title is required').notEmpty(),
    check('title', 'Title must be less than 100 characters').isLength({ max: 100 }),
    check('description', 'Description must be less than 500 characters').isLength({ max: 500 }),
  ],
  taskController.updateTask
);

module.exports = router;