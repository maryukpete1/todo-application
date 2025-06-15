const cron = require('node-cron');
const Task = require('../models/Task');
const logger = require('../config/winston');

// Clean up deleted tasks older than 30 days
const cleanupDeletedTasks = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Task.deleteMany({
      status: 'deleted',
      updatedAt: { $lt: thirtyDaysAgo },
    });

    if (result.deletedCount > 0) {
      console.log(`[Cron] Cleaned up ${result.deletedCount} deleted tasks`);
    }
  } catch (err) {
    console.error('[Cron] Error in cleanupDeletedTasks:', err.message);
  }
};

// Notify about upcoming due tasks (example)
const notifyUpcomingTasks = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      status: 'pending',
      dueDate: {
        $gte: new Date(),
        $lt: tomorrow,
      },
    }).populate('user', 'email');

    if (tasks.length > 0) {
      logger.info(`Found ${tasks.length} tasks due today`);
      // In a real app, you would send notifications here
    }
  } catch (err) {
    logger.error('Error in notifyUpcomingTasks:', err);
  }
};

const startCronJobs = () => {
  try {
    // Run every day at midnight
    cron.schedule('0 0 * * *', cleanupDeletedTasks);
    
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', notifyUpcomingTasks);
    
    console.log('[Cron] Jobs started successfully');
  } catch (err) {
    console.error('[Cron] Failed to start jobs:', err.message);
  }
};

module.exports = {
  startCronJobs,
  cleanupDeletedTasks,
  notifyUpcomingTasks,
};