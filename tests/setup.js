require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('../config/winston');
const { app, createSessionMiddleware } = require('./testApp');

// Increase timeout for all tests
jest.setTimeout(30000);

let mongoServer;

// Connect to the in-memory database
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Wait for connection to be ready
    await mongoose.connection.db.admin().ping();
    
    // Add session middleware after MongoDB is connected
    app.use(createSessionMiddleware(mongoUri));
    
    logger.info('Connected to in-memory MongoDB');
  } catch (err) {
    logger.error('Error connecting to in-memory MongoDB:', err);
    throw err;
  }
});

// Clear all collections and indexes before each test
beforeEach(async () => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection not established');
    }
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
      await collection.dropIndexes();
    }
    logger.info('Cleared all collections and indexes');
  } catch (err) {
    logger.error('Error clearing collections:', err);
    throw err;
  }
});

// Disconnect and stop server after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.db) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    logger.info('Disconnected from in-memory MongoDB');
  } catch (err) {
    logger.error('Error disconnecting from in-memory MongoDB:', err);
    throw err;
  }
}); 