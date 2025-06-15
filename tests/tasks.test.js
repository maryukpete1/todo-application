const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const passport = require('passport');

describe('Task Controller', () => {
  let user;
  let authToken;
  let agent;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    agent = request.agent(app);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});

    user = new User({
      username: 'testuser',
      password: 'testpass123'
    });
    await user.save();

    // Login the user
    await agent
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });
  });

  describe('GET /tasks', () => {
    it('should get all tasks for logged in user', async () => {
      await Task.create([
        { title: 'Task 1', user: user._id },
        { title: 'Task 2', user: user._id }
      ]);

      const res = await agent.get('/tasks');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Task 1');
      expect(res.text).toContain('Task 2');
    });

    it('should not show tasks of other users', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        password: 'otherpass'
      });

      await Task.create([
        { title: 'My Task', user: user._id },
        { title: 'Other Task', user: otherUser._id }
      ]);

      const res = await agent.get('/tasks');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('My Task');
      expect(res.text).not.toContain('Other Task');
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const res = await agent
        .post('/tasks')
        .send({
          title: 'New Task',
          description: 'Task description'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks');

      const task = await Task.findOne({ title: 'New Task' });
      expect(task).toBeTruthy();
      expect(task.user.toString()).toBe(user._id.toString());
    });

    it('should not create task with invalid data', async () => {
      const res = await agent
        .post('/tasks')
        .send({
          title: '',
          description: 'Task description'
        });
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks/new');

      const tasks = await Task.find({});
      expect(tasks.length).toBe(0);
    });
  });

  describe('PUT /tasks/:id/status', () => {
    it('should update task status', async () => {
      const task = await Task.create({
        title: 'Test Task',
        user: user._id
      });

      const res = await agent
        .post(`/tasks/${task._id}/status`)
        .send({ status: 'completed' })
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks');

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.status).toBe('completed');
    });

    it('should not update task of other user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        password: 'otherpass'
      });

      const task = await Task.create({
        title: 'Other Task',
        user: otherUser._id
      });

      const res = await agent
        .post(`/tasks/${task._id}/status`)
        .send({ status: 'completed' })
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks');

      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.status).toBe('pending');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const task = await Task.create({
        title: 'Task to delete',
        user: user._id
      });

      const res = await agent
        .post(`/tasks/${task._id}`)
        .send({ _method: 'DELETE' })
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks');

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should not delete task of other user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        password: 'otherpass'
      });

      const task = await Task.create({
        title: 'Other Task',
        user: otherUser._id
      });

      const res = await agent
        .post(`/tasks/${task._id}`)
        .send({ _method: 'DELETE' })
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(res.statusCode).toEqual(302);
      expect(res.header.location).toBe('/tasks');

      const notDeletedTask = await Task.findById(task._id);
      expect(notDeletedTask).toBeTruthy();
    });
  });
});