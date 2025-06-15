const request = require('supertest');
const testSetup = require('./helpers/testSetup');
const createTestApp = require('./helpers/testApp');
const User = require('../models/User');

describe('Auth Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    await testSetup.connect();
    app = createTestApp(testSetup.mongoUri);
    server = app.listen(0);
    await testSetup.createTestUser();
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    await testSetup.disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123'
      };

      const res = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/auth/login');

      // Verify user was created
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Duplicate User',
          password: 'password123'
        });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/auth/register');

      // Verify no duplicate user was created
      const users = await User.find({ email: 'test@example.com' });
      expect(users.length).toBe(1);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // First login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      // Get the session cookie
      const cookies = loginRes.header['set-cookie'];

      // Verify login response
      expect(loginRes.status).toBe(302);
      expect(loginRes.header.location).toBe('/tasks');
      expect(cookies).toBeTruthy();

      // Verify session by accessing tasks
      const tasksRes = await request(app)
        .get('/tasks')
        .set('Cookie', cookies);

      // If we get redirected to login, the session wasn't maintained
      if (tasksRes.status === 302 && tasksRes.header.location === '/auth/login') {
        throw new Error('Session not maintained after login');
      }

      expect(tasksRes.status).toBe(200);
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
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
          email: 'test@example.com',
          password: 'testpass123'
        });

      const cookies = loginRes.header['set-cookie'][0];

      // Then logout
      const logoutRes = await request(app)
        .get('/auth/logout')
        .set('Cookie', cookies);

      expect(logoutRes.status).toBe(302);
      expect(logoutRes.header.location).toBe('/');

      // Verify we can't access tasks
      const tasksRes = await request(app)
        .get('/tasks')
        .set('Cookie', cookies);

      expect(tasksRes.status).toBe(302);
      expect(tasksRes.header.location).toBe('/auth/login');
    });
  });
}); 