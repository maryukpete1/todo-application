const request = require('supertest');
const mongoose = require('mongoose');
const testSetup = require('./helpers/testSetup');
const createTestApp = require('./helpers/testAppFactory');
const Task = require('../models/Task');
const logger = require('../config/winston');

describe('Task Endpoints', () => {
  let app;
  let server;
  let testUser;
  let authCookie;

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

    // Login and get session cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'testpass123'
      });

    authCookie = loginRes.headers['set-cookie'];
  });

  describe('GET /tasks', () => {
    it('should get tasks when logged in', async () => {
      // Create a test task
      await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        user: testUser._id
      });

      const res = await request(app)
        .get('/tasks')
        .set('Cookie', authCookie)
        .set('Accept', 'text/html');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Test Task');
      expect(res.text).toContain('Test Description');
    });

    it('should redirect to login when not logged in', async () => {
      const res = await request(app)
        .get('/tasks');

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/auth/login');
    });
  });

  describe('POST /tasks', () => {
    it('should create task when logged in', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Cookie', authCookie)
        .set('Accept', 'text/html')
        .send({
          title: 'New Task',
          description: 'New Description'
        });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/tasks');

      const task = await Task.findOne({ title: 'New Task' });
      expect(task).toBeTruthy();
      expect(task.user.toString()).toBe(testUser._id.toString());
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update task when logged in', async () => {
      const task = await Task.create({
        title: 'Original Task',
        description: 'Original Description',
        user: testUser._id
      });

      const res = await request(app)
        .put(`/tasks/${task._id}`)
        .set('Cookie', authCookie)
        .set('Accept', 'text/html')
        .send({
          title: 'Updated Task',
          description: 'Updated Description'
        });

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/tasks');

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.title).toBe('Updated Task');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete task when logged in', async () => {
      const task = await Task.create({
        title: 'Task to Delete',
        description: 'Will be deleted',
        user: testUser._id
      });

      const res = await request(app)
        .delete(`/tasks/${task._id}`)
        .set('Cookie', authCookie)
        .set('Accept', 'text/html');

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/tasks');

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });
}); 