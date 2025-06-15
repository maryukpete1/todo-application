const mongoose = require('mongoose');

const statusEnum = ['pending', 'completed', 'deleted'];

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  status: {
    type: String,
    enum: statusEnum,
    default: 'pending',
  },
  dueDate: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
TaskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Query helper to filter by status
TaskSchema.query.byStatus = function (status) {
  return this.where({ status });
};

module.exports = mongoose.model('Task', TaskSchema);