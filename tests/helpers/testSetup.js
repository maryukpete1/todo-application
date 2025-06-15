const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const logger = require('../../config/winston');

class TestSetup {
  constructor() {
    this.mongoServer = null;
    this.mongoUri = null;
  }

  async connect() {
    try {
      this.mongoServer = await MongoMemoryServer.create();
      this.mongoUri = this.mongoServer.getUri();
      
      await mongoose.connect(this.mongoUri);
      await mongoose.connection.db.admin().ping();
      
      logger.info('Connected to test MongoDB');
    } catch (err) {
      logger.error('Test database connection error:', err);
      throw err;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      await this.mongoServer.stop();
      logger.info('Disconnected from test MongoDB');
    } catch (err) {
      logger.error('Test database disconnection error:', err);
      throw err;
    }
  }

  async clearDatabase() {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany();
      }
      logger.info('Test database cleared');
    } catch (err) {
      logger.error('Test database clear error:', err);
      throw err;
    }
  }

  async createTestUser() {
    try {
      await this.clearDatabase();

      // Create user using the User model directly
      const user = new User({
        email: 'test@example.com',
        password: 'testpass123',
        name: 'Test User'
      });

      // Save the user - this will trigger the pre-save middleware for password hashing
      await user.save();

      // Verify user was created and password was hashed
      const createdUser = await User.findOne({ email: 'test@example.com' }).select('+password');
      if (!createdUser) {
        throw new Error('Test user creation failed');
      }

      // Verify password was hashed (should start with $2)
      if (!createdUser.password.startsWith('$2')) {
        throw new Error('Password was not hashed');
      }

      // Verify we can authenticate with the password
      const isAuthenticated = await createdUser.comparePassword('testpass123');
      if (!isAuthenticated) {
        throw new Error('Password authentication failed');
      }

      logger.info('Test user created successfully:', user.email);
      return user;
    } catch (err) {
      logger.error('Create test user error:', err);
      throw err;
    }
  }
}

module.exports = new TestSetup(); 