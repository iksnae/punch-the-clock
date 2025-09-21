import { DatabaseConnection } from '../../src/database/connection';
import { DatabaseConfig } from '../../src/database/types';
import { ProjectService } from '../../src/services/ProjectService';
import { TaskService } from '../../src/services/TaskService';
import { TimeTrackingService } from '../../src/services/TimeTrackingService';
import { ProjectRepository } from '../../src/repositories/ProjectRepository';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { TaskTagRepository } from '../../src/repositories/TaskTagRepository';
import { TimeSessionRepository } from '../../src/repositories/TimeSessionRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Integration Tests', () => {
  let db: DatabaseConnection;
  let projectService: ProjectService;
  let taskService: TaskService;
  let timeTrackingService: TimeTrackingService;
  const testDbPath = path.join(__dirname, '../test-db.sqlite');

  const testConfig: DatabaseConfig = {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'test_ptc',
    connectionLimit: 5,
    acquireTimeout: 60000,
    timeout: 60000,
    ssl: false,
  };

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize database connection
    db = new DatabaseConnection();
    await db.connect(testConfig);

    // Initialize repositories
    const projectRepo = new ProjectRepository(db);
    const taskRepo = new TaskRepository(db);
    const taskTagRepo = new TaskTagRepository(db);
    const timeSessionRepo = new TimeSessionRepository(db);

    // Initialize services
    projectService = new ProjectService(projectRepo);
    taskService = new TaskService(taskRepo, taskTagRepo);
    timeTrackingService = new TimeTrackingService(timeSessionRepo);
  });

  afterAll(async () => {
    if (db) {
      await db.disconnect();
    }
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Project Operations', () => {
    it('should create and retrieve a project', async () => {
      const project = await projectService.createProject('Test Project', 'A test project');
      
      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test project');
      expect(project.id).toBeGreaterThan(0);

      const retrievedProject = await projectService.getProject(project.id);
      expect(retrievedProject).toBeDefined();
      expect(retrievedProject?.name).toBe('Test Project');
    });

    it('should list projects', async () => {
      const projects = await projectService.listProjects();
      expect(projects).toBeDefined();
      expect(projects.length).toBeGreaterThan(0);
    });

    it('should update a project', async () => {
      const project = await projectService.createProject('Update Test', 'Original description');
      
      const updatedProject = await projectService.updateProject(project.id, {
        name: 'Updated Project',
        description: 'Updated description',
      });

      expect(updatedProject.name).toBe('Updated Project');
      expect(updatedProject.description).toBe('Updated description');
    });

    it('should delete a project', async () => {
      const project = await projectService.createProject('Delete Test', 'To be deleted');
      
      await projectService.deleteProject(project.id);
      
      const deletedProject = await projectService.getProject(project.id);
      expect(deletedProject).toBeNull();
    });

    it('should validate project names', async () => {
      const validation = await projectService.validateProjectName('Valid Project Name');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const invalidValidation = await projectService.validateProjectName('');
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    it('should check project existence', async () => {
      const project = await projectService.createProject('Existence Test', 'Test project');
      
      const exists = await projectService.projectExists(project.id);
      expect(exists).toBe(true);

      const notExists = await projectService.projectExists(99999);
      expect(notExists).toBe(false);
    });
  });

  describe('Task Operations', () => {
    let testProject: any;

    beforeEach(async () => {
      testProject = await projectService.createProject('Task Test Project', 'For testing tasks');
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
    });

    it('should create and retrieve a task', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TASK-1',
        title: 'Test Task',
        description: 'A test task',
        state: 'pending',
        tags: ['test', 'integration'],
      });

      expect(task).toBeDefined();
      expect(task.number).toBe('TASK-1');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('A test task');
      expect(task.state).toBe('pending');
      expect(task.tags).toEqual(['test', 'integration']);

      const retrievedTask = await taskService.getTask(task.id);
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask?.number).toBe('TASK-1');
    });

    it('should list tasks for a project', async () => {
      await taskService.createTask(testProject.id, {
        number: 'TASK-1',
        title: 'Task 1',
        description: 'First task',
        state: 'pending',
      });

      await taskService.createTask(testProject.id, {
        number: 'TASK-2',
        title: 'Task 2',
        description: 'Second task',
        state: 'in-progress',
      });

      const tasks = await taskService.listTasks(testProject.id);
      expect(tasks).toBeDefined();
      expect(tasks.length).toBe(2);
    });

    it('should update a task', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TASK-1',
        title: 'Original Title',
        description: 'Original description',
        state: 'pending',
      });

      const updatedTask = await taskService.updateTask(task.id, {
        title: 'Updated Title',
        description: 'Updated description',
        state: 'in-progress',
      });

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.description).toBe('Updated description');
      expect(updatedTask.state).toBe('in-progress');
    });

    it('should manage task tags', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TASK-1',
        title: 'Tag Test Task',
        description: 'Testing tags',
        state: 'pending',
      });

      // Add tags
      await taskService.addTag(task.id, 'tag1');
      await taskService.addTag(task.id, 'tag2');

      let tags = await taskService.getTags(task.id);
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');

      // Remove a tag
      await taskService.removeTag(task.id, 'tag1');
      tags = await taskService.getTags(task.id);
      expect(tags).not.toContain('tag1');
      expect(tags).toContain('tag2');

      // Set new tags
      await taskService.setTags(task.id, ['tag3', 'tag4']);
      tags = await taskService.getTags(task.id);
      expect(tags).toEqual(['tag3', 'tag4']);
    });

    it('should delete a task', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TASK-1',
        title: 'Delete Test Task',
        description: 'To be deleted',
        state: 'pending',
      });

      await taskService.deleteTask(task.id);

      const deletedTask = await taskService.getTask(task.id);
      expect(deletedTask).toBeNull();
    });

    it('should validate task numbers', async () => {
      const validation = await taskService.validateTaskNumber(testProject.id, 'VALID-123');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const invalidValidation = await taskService.validateTaskNumber(testProject.id, '');
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    it('should generate unique task numbers', async () => {
      const number1 = await taskService.generateTaskNumber(testProject.id, 'TEST');
      const number2 = await taskService.generateTaskNumber(testProject.id, 'TEST');
      
      expect(number1).toBe('TEST-1');
      expect(number2).toBe('TEST-2');
    });
  });

  describe('Time Tracking Operations', () => {
    let testProject: any;
    let testTask: any;

    beforeEach(async () => {
      testProject = await projectService.createProject('Time Test Project', 'For testing time tracking');
      testTask = await taskService.createTask(testProject.id, {
        number: 'TIME-1',
        title: 'Time Test Task',
        description: 'Testing time tracking',
        state: 'pending',
      });
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
    });

    it('should start time tracking', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      expect(session).toBeDefined();
      expect(session.taskId).toBe(testTask.id);
      expect(session.status).toBe('active');
      expect(session.startedAt).toBeDefined();
    });

    it('should pause and resume time tracking', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      // Pause
      const pausedSession = await timeTrackingService.pauseTracking(session.id);
      expect(pausedSession.status).toBe('paused');
      expect(pausedSession.pausedAt).toBeDefined();

      // Resume
      const resumedSession = await timeTrackingService.resumeTracking(session.id);
      expect(resumedSession.status).toBe('active');
      expect(resumedSession.resumedAt).toBeDefined();
    });

    it('should stop time tracking', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stoppedSession = await timeTrackingService.stopTracking(session.id);
      expect(stoppedSession.status).toBe('stopped');
      expect(stoppedSession.endedAt).toBeDefined();
      expect(stoppedSession.durationSeconds).toBeGreaterThan(0);
    });

    it('should get active session', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      const activeSession = await timeTrackingService.getActiveSession();
      expect(activeSession).toBeDefined();
      expect(activeSession?.id).toBe(session.id);
      expect(activeSession?.status).toBe('active');
    });

    it('should list time sessions', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      await timeTrackingService.stopTracking(session.id);
      
      const sessions = await timeTrackingService.listSessions({ taskId: testTask.id });
      expect(sessions).toBeDefined();
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(session.id);
    });

    it('should calculate total time for task', async () => {
      // Start and stop multiple sessions
      const session1 = await timeTrackingService.startTracking(testTask.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      await timeTrackingService.stopTracking(session1.id);

      const session2 = await timeTrackingService.startTracking(testTask.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      await timeTrackingService.stopTracking(session2.id);

      const totalTime = await timeTrackingService.getTotalTimeForTask(testTask.id);
      expect(totalTime).toBeGreaterThan(0);
    });

    it('should prevent multiple active sessions', async () => {
      await timeTrackingService.startTracking(testTask.id);
      
      // Try to start another session - should fail
      await expect(timeTrackingService.startTracking(testTask.id))
        .rejects.toThrow('Time tracking is already active for this task');
    });

    it('should handle session state transitions correctly', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      // Can't stop a paused session without resuming first
      await timeTrackingService.pauseTracking(session.id);
      await expect(timeTrackingService.stopTracking(session.id))
        .rejects.toThrow('Cannot stop session in paused state');
      
      // Resume and then stop
      await timeTrackingService.resumeTracking(session.id);
      await timeTrackingService.stopTracking(session.id);
      
      // Can't pause a stopped session
      await expect(timeTrackingService.pauseTracking(session.id))
        .rejects.toThrow('Cannot pause session in stopped state');
    });
  });

  describe('Database Transactions', () => {
    it('should handle transaction rollback on error', async () => {
      const project = await projectService.createProject('Transaction Test', 'Testing transactions');
      
      try {
        await db.executeTransaction(async () => {
          // Create a task
          await taskService.createTask(project.id, {
            number: 'TRANS-1',
            title: 'Transaction Task',
            description: 'Task in transaction',
            state: 'pending',
          });
          
          // Force an error
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }
      
      // Task should not exist due to rollback
      const tasks = await taskService.listTasks(project.id);
      expect(tasks).toHaveLength(0);
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should commit transaction on success', async () => {
      const project = await projectService.createProject('Transaction Success Test', 'Testing successful transactions');
      
      await db.executeTransaction(async () => {
        await taskService.createTask(project.id, {
          number: 'TRANS-2',
          title: 'Successful Transaction Task',
          description: 'Task in successful transaction',
          state: 'pending',
        });
      });
      
      // Task should exist due to commit
      const tasks = await taskService.listTasks(project.id);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].number).toBe('TRANS-2');
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });

  describe('Database Performance', () => {
    it('should handle multiple concurrent operations', async () => {
      const project = await projectService.createProject('Concurrency Test', 'Testing concurrent operations');
      
      // Create multiple tasks concurrently
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        taskService.createTask(project.id, {
          number: `CONC-${i + 1}`,
          title: `Concurrent Task ${i + 1}`,
          description: `Task ${i + 1} created concurrently`,
          state: 'pending',
        })
      );
      
      const tasks = await Promise.all(taskPromises);
      expect(tasks).toHaveLength(10);
      
      // Verify all tasks were created
      const allTasks = await taskService.listTasks(project.id);
      expect(allTasks).toHaveLength(10);
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should handle large result sets efficiently', async () => {
      const project = await projectService.createProject('Large Dataset Test', 'Testing large datasets');
      
      // Create many tasks
      const taskPromises = Array.from({ length: 100 }, (_, i) =>
        taskService.createTask(project.id, {
          number: `LARGE-${i + 1}`,
          title: `Large Dataset Task ${i + 1}`,
          description: `Task ${i + 1} in large dataset`,
          state: 'pending',
        })
      );
      
      await Promise.all(taskPromises);
      
      // List all tasks
      const startTime = Date.now();
      const tasks = await taskService.listTasks(project.id);
      const endTime = Date.now();
      
      expect(tasks).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });
});
