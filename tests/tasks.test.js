const request = require('supertest');
const testSetup = require('./helpers/testSetup');
const createTestApp = require('./helpers/testApp');
const Task = require('../models/Task');

describe('Task Endpoints', () => {
  let app;
  let server;
  let authCookie;

  beforeAll(async () => {
    await testSetup.connect();
    app = createTestApp(testSetup.mongoUri);
    server = app.listen(0);
    await testSetup.createTestUser();

    // Login and get cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpass123'
      });

    authCookie = loginRes.header['set-cookie'][0];
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    await testSetup.disconnect();
  });

  describe('GET /tasks', () => {
    it('should get tasks when logged in', async () => {
      // Create a task
      await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        user: (await testSetup.createTestUser())._id
      });

      const res = await request(app)
        .get('/tasks')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
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
        .send({
          title: 'New Task',
          description: 'New Description'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Task');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update task when logged in', async () => {
      // Create a task
      const task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        user: (await testSetup.createTestUser())._id
      });

      const res = await request(app)
        .put(`/tasks/${task._id}`)
        .set('Cookie', authCookie)
        .send({
          title: 'Updated Task'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Task');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete task when logged in', async () => {
      // Create a task
      const task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        user: (await testSetup.createTestUser())._id
      });

      const res = await request(app)
        .delete(`/tasks/${task._id}`)
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });
}); 