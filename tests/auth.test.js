const request = require('supertest');
const mongoose = require('mongoose');
const testSetup = require('./helpers/testSetup');
const createTestApp = require('./helpers/testAppFactory');
const User = require('../models/User');
const logger = require('../config/winston');

describe('Auth Endpoints', () => {
  let app;
  let server;
  let testUser;

  beforeAll(async () => {
    await testSetup.connect();
    app = createTestApp(testSetup.mongoUri);
    server = app.listen(0);
    testUser = await testSetup.createTestUser();
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    await testSetup.disconnect();
  });

  beforeEach(async () => {
    await testSetup.clearDatabase();
    testUser = await testSetup.createTestUser();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'newpass123',
          name: 'New User'
        });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/auth/login');

      const user = await User.findOne({ email: 'new@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('New User');
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: 'testpass123',
          name: 'Test User'
        });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/auth/register');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'testpass123'
        });

      expect(loginRes.status).toBe(302);
      expect(loginRes.header.location).toBe('/tasks');

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeTruthy();

      // Verify session by accessing tasks
      const tasksRes = await request(app)
        .get('/tasks')
        .set('Cookie', cookies)
        .set('Accept', 'text/html');

      expect(tasksRes.status).toBe(200);
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpass'
        });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/auth/login');
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout user', async () => {
      // First login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'testpass123'
        });

      const cookies = loginRes.headers['set-cookie'];

      // Then logout
      const logoutRes = await request(app)
        .get('/auth/logout')
        .set('Cookie', cookies);

      // After logout, we get redirected to login due to session destruction
      expect(logoutRes.status).toBe(302);
      expect(logoutRes.header.location).toBe('/auth/login');

      // Verify we can't access tasks
      const tasksRes = await request(app)
        .get('/tasks')
        .set('Cookie', cookies);

      expect(tasksRes.status).toBe(302);
      expect(tasksRes.header.location).toBe('/auth/login');
    });
  });
}); 