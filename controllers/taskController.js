const Task = require('../models/Task');
const logger = require('../config/winston');
const { validationResult } = require('express-validator');

exports.getAllTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { user: req.user._id };
    
    if (status && ['pending', 'completed'].includes(status)) {
      query.status = status;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.render('tasks/index', { tasks, statusFilter: status || 'all' });
  } catch (err) {
    logger.error('Error fetching tasks:', err);
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect('/tasks/new');
  }

  const { title, description, dueDate } = req.body;

  try {
    const task = new Task({
      title,
      description,
      dueDate: dueDate || null,
      user: req.user._id,
    });

    await task.save();
    req.flash('success_msg', 'Task created successfully');
    res.redirect('/tasks');
    logger.info(`New task created by user ${req.user.email}`);
  } catch (err) {
    logger.error('Error creating task:', err);
    next(err);
  }
};

exports.updateTaskStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const task = await Task.findOne({ _id: id, user: req.user._id });
    if (!task) {
      req.flash('error_msg', 'Task not found');
      return res.redirect('/tasks');
    }

    task.status = status;
    await task.save();

    req.flash('success_msg', 'Task status updated');
    res.redirect('/tasks');
    logger.info(`Task ${id} status updated to ${status} by user ${req.user.email}`);
  } catch (err) {
    logger.error('Error updating task status:', err);
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });
    if (!task) {
      req.flash('error_msg', 'Task not found');
      return res.redirect('/tasks');
    }

    req.flash('success_msg', 'Task deleted successfully');
    res.redirect('/tasks');
    logger.info(`Task ${id} deleted by user ${req.user.email}`);
  } catch (err) {
    logger.error('Error deleting task:', err);
    next(err);
  }
};

exports.showCreateForm = (req, res) => {
  res.render('tasks/create');
};

// Add these methods to the existing taskController.js

exports.showEditForm = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      req.flash('error_msg', 'Task not found');
      return res.redirect('/tasks');
    }
    res.render('tasks/edit', { task });
  } catch (err) {
    logger.error('Error fetching task for edit:', err);
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect(`/tasks/${req.params.id}/edit`);
  }

  const { title, description, dueDate, status } = req.body;

  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, description, dueDate: dueDate || null, status },
      { new: true, runValidators: true }
    );

    if (!task) {
      req.flash('error_msg', 'Task not found');
      return res.redirect('/tasks');
    }

    req.flash('success_msg', 'Task updated successfully');
    res.redirect('/tasks');
    logger.info(`Task ${req.params.id} updated by user ${req.user.email}`);
  } catch (err) {
    logger.error('Error updating task:', err);
    next(err);
  }
};