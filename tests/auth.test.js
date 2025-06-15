const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../config/winston');

describe('Auth Controller', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/login');

      const user = await User.findOne({ username: 'testuser' });
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
    });

    it('should not register with existing username', async () => {
      await User.create({
        username: 'testuser',
        password: 'testpass123'
      });

      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/register');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      const user = new User({
        username: 'testuser',
        password: 'testpass123'
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'wrongpass'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/login');
    });

    it('should not login with non-existent user', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          username: 'nonexistent',
          password: 'testpass123'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/login');
    });
  });
});