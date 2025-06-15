const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../../config/winston');

class TestSetup {
  constructor() {
    this.mongoServer = null;
    this.mongoUri = null;
  }

  async connect() {
    // Create in-memory MongoDB server with fixed port
    this.mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'testdb'
      }
    });
    this.mongoUri = this.mongoServer.getUri();

    // Connect to MongoDB with hardcoded options
    await mongoose.connect(this.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  async disconnect() {
    await mongoose.disconnect();
    await this.mongoServer.stop();
  }

  async clearDatabase() {
    await User.deleteMany({});
  }

  async createTestUser() {
    try {
      // Clear any existing users first
      await User.deleteMany({});

      // Create test user with proper password hashing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('testpass123', salt);

      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword
      });

      // Verify user was created with password
      const createdUser = await User.findOne({ email: user.email }).select('+password');
      if (!createdUser || !createdUser.password) {
        throw new Error('Test user was not created properly');
      }

      // Verify password can be compared
      const isMatch = await bcrypt.compare('testpass123', createdUser.password);
      if (!isMatch) {
        throw new Error('Password hashing verification failed');
      }

      logger.info('Test user created and verified:', user.email);
      return user;
    } catch (err) {
      logger.error('Create test user error:', err);
      throw err;
    }
  }
}

module.exports = new TestSetup(); 