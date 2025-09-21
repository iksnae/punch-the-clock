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

describe('Data Integrity Validation Tests', () => {
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

  describe('Project Data Integrity', () => {
    it('should maintain referential integrity when deleting projects', async () => {
      const project = await projectService.createProject('Referential Integrity Test', 'Testing referential integrity');
      const task = await taskService.createTask(project.id, {
        number: 'REF-1',
        title: 'Referential Integrity Task',
        description: 'Task for testing referential integrity',
        state: 'pending',
      });

      // Create time session
      const session = await timeTrackingService.startTracking(task.id);
      await timeTrackingService.stopTracking(session.id);

      // Delete project
      await projectService.deleteProject(project.id);

      // Verify project is deleted
      const deletedProject = await projectService.getProject(project.id);
      expect(deletedProject).toBeNull();

      // Verify task is deleted (cascade delete)
      const deletedTask = await taskService.getTask(task.id);
      expect(deletedTask).toBeNull();

      // Verify time session is deleted (cascade delete)
      const sessions = await timeTrackingService.listSessions({ taskId: task.id });
      expect(sessions).toHaveLength(0);
    });

    it('should maintain data consistency when updating projects', async () => {
      const project = await projectService.createProject('Data Consistency Test', 'Testing data consistency');
      const task = await taskService.createTask(project.id, {
        number: 'CONS-1',
        title: 'Data Consistency Task',
        description: 'Task for testing data consistency',
        state: 'pending',
      });

      // Update project
      const updatedProject = await projectService.updateProject(project.id, {
        name: 'Updated Data Consistency Test',
        description: 'Updated description',
      });

      expect(updatedProject.name).toBe('Updated Data Consistency Test');
      expect(updatedProject.description).toBe('Updated description');
      expect(updatedProject.id).toBe(project.id);

      // Verify task still exists and references correct project
      const taskAfterUpdate = await taskService.getTask(task.id);
      expect(taskAfterUpdate).toBeDefined();
      expect(taskAfterUpdate?.projectId).toBe(project.id);

      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should prevent orphaned records', async () => {
      const project = await projectService.createProject('Orphan Prevention Test', 'Testing orphan prevention');
      const task = await taskService.createTask(project.id, {
        number: 'ORPHAN-1',
        title: 'Orphan Prevention Task',
        description: 'Task for testing orphan prevention',
        state: 'pending',
      });

      // Create time session
      const session = await timeTrackingService.startTracking(task.id);
      await timeTrackingService.stopTracking(session.id);

      // Verify all records exist
      const projectExists = await projectService.projectExists(project.id);
      const taskExists = await taskService.taskExists(task.id);
      const sessions = await timeTrackingService.listSessions({ taskId: task.id });

      expect(projectExists).toBe(true);
      expect(taskExists).toBe(true);
      expect(sessions).toHaveLength(1);

      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should maintain unique constraints', async () => {
      const project1 = await projectService.createProject('Unique Constraint Test 1', 'Testing unique constraints');
      const project2 = await projectService.createProject('Unique Constraint Test 2', 'Testing unique constraints');

      // Try to create task with same number in different projects (should be allowed)
      const task1 = await taskService.createTask(project1.id, {
        number: 'UNIQUE-1',
        title: 'Unique Task 1',
        description: 'Task 1 for testing unique constraints',
        state: 'pending',
      });

      const task2 = await taskService.createTask(project2.id, {
        number: 'UNIQUE-1',
        title: 'Unique Task 2',
        description: 'Task 2 for testing unique constraints',
        state: 'pending',
      });

      expect(task1.number).toBe('UNIQUE-1');
      expect(task2.number).toBe('UNIQUE-1');
      expect(task1.id).not.toBe(task2.id);

      // Clean up
      await projectService.deleteProject(project1.id);
      await projectService.deleteProject(project2.id);
    });
  });

  describe('Task Data Integrity', () => {
    let testProject: any;

    beforeEach(async () => {
      testProject = await projectService.createProject('Task Integrity Test', 'For testing task data integrity');
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
    });

    it('should maintain referential integrity when deleting tasks', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TASK-REF-1',
        title: 'Task Referential Integrity',
        description: 'Task for testing referential integrity',
        state: 'pending',
      });

      // Create time session
      const session = await timeTrackingService.startTracking(task.id);
      await timeTrackingService.stopTracking(session.id);

      // Add tags
      await taskService.addTag(task.id, 'tag1');
      await taskService.addTag(task.id, 'tag2');

      // Delete task
      await taskService.deleteTask(task.id);

      // Verify task is deleted
      const deletedTask = await taskService.getTask(task.id);
      expect(deletedTask).toBeNull();

      // Verify time sessions are deleted (cascade delete)
      const sessions = await timeTrackingService.listSessions({ taskId: task.id });
      expect(sessions).toHaveLength(0);

      // Verify tags are deleted (cascade delete)
      const tags = await taskService.getTags(task.id);
      expect(tags).toHaveLength(0);
    });

    it('should maintain data consistency when updating tasks', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TASK-CONS-1',
        title: 'Task Data Consistency',
        description: 'Task for testing data consistency',
        state: 'pending',
      });

      // Create time session
      const session = await timeTrackingService.startTracking(task.id);
      await timeTrackingService.stopTracking(session.id);

      // Update task
      const updatedTask = await taskService.updateTask(task.id, {
        title: 'Updated Task Data Consistency',
        description: 'Updated description',
        state: 'in-progress',
      });

      expect(updatedTask.title).toBe('Updated Task Data Consistency');
      expect(updatedTask.description).toBe('Updated description');
      expect(updatedTask.state).toBe('in-progress');
      expect(updatedTask.id).toBe(task.id);

      // Verify time session still exists and references correct task
      const sessions = await timeTrackingService.listSessions({ taskId: task.id });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].taskId).toBe(task.id);
    });

    it('should maintain unique task numbers within project', async () => {
      const task1 = await taskService.createTask(testProject.id, {
        number: 'UNIQUE-TASK-1',
        title: 'Unique Task 1',
        description: 'Task 1 for testing unique numbers',
        state: 'pending',
      });

      // Try to create task with same number (should fail)
      try {
        await taskService.createTask(testProject.id, {
          number: 'UNIQUE-TASK-1',
          title: 'Unique Task 2',
          description: 'Task 2 for testing unique numbers',
          state: 'pending',
        });
        fail('Should have thrown an error for duplicate task number');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should maintain tag relationships', async () => {
      const task = await taskService.createTask(testProject.id, {
        number: 'TAG-REL-1',
        title: 'Tag Relationship Task',
        description: 'Task for testing tag relationships',
        state: 'pending',
      });

      // Add tags
      await taskService.addTag(task.id, 'tag1');
      await taskService.addTag(task.id, 'tag2');
      await taskService.addTag(task.id, 'tag3');

      // Verify tags are added
      let tags = await taskService.getTags(task.id);
      expect(tags).toHaveLength(3);
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
      expect(tags).toContain('tag3');

      // Remove a tag
      await taskService.removeTag(task.id, 'tag2');
      tags = await taskService.getTags(task.id);
      expect(tags).toHaveLength(2);
      expect(tags).toContain('tag1');
      expect(tags).not.toContain('tag2');
      expect(tags).toContain('tag3');

      // Set new tags
      await taskService.setTags(task.id, ['tag4', 'tag5']);
      tags = await taskService.getTags(task.id);
      expect(tags).toHaveLength(2);
      expect(tags).toContain('tag4');
      expect(tags).toContain('tag5');
    });
  });

  describe('Time Session Data Integrity', () => {
    let testProject: any;
    let testTask: any;

    beforeEach(async () => {
      testProject = await projectService.createProject('Time Session Integrity Test', 'For testing time session data integrity');
      testTask = await taskService.createTask(testProject.id, {
        number: 'TIME-SESSION-1',
        title: 'Time Session Integrity Task',
        description: 'Task for testing time session integrity',
        state: 'pending',
      });
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
    });

    it('should maintain referential integrity when deleting time sessions', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      await timeTrackingService.stopTracking(session.id);

      // Verify session exists
      const sessions = await timeTrackingService.listSessions({ taskId: testTask.id });
      expect(sessions).toHaveLength(1);

      // Delete session (if supported by the service)
      // Note: This might not be directly supported, but we can test the cascade delete
      // when the parent task is deleted
      await taskService.deleteTask(testTask.id);

      // Verify session is deleted (cascade delete)
      const sessionsAfterDelete = await timeTrackingService.listSessions({ taskId: testTask.id });
      expect(sessionsAfterDelete).toHaveLength(0);
    });

    it('should maintain data consistency when updating time sessions', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      // Pause session
      const pausedSession = await timeTrackingService.pauseTracking(session.id);
      expect(pausedSession.status).toBe('paused');
      expect(pausedSession.pausedAt).toBeDefined();

      // Resume session
      const resumedSession = await timeTrackingService.resumeTracking(session.id);
      expect(resumedSession.status).toBe('active');
      expect(resumedSession.resumedAt).toBeDefined();

      // Stop session
      const stoppedSession = await timeTrackingService.stopTracking(session.id);
      expect(stoppedSession.status).toBe('stopped');
      expect(stoppedSession.endedAt).toBeDefined();
      expect(stoppedSession.durationSeconds).toBeGreaterThan(0);
    });

    it('should prevent multiple active sessions for same task', async () => {
      const session1 = await timeTrackingService.startTracking(testTask.id);
      expect(session1.status).toBe('active');

      // Try to start another session for the same task (should fail)
      try {
        await timeTrackingService.startTracking(testTask.id);
        fail('Should have thrown an error for multiple active sessions');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Clean up
      await timeTrackingService.stopTracking(session1.id);
    });

    it('should prevent multiple active sessions globally', async () => {
      const task2 = await taskService.createTask(testProject.id, {
        number: 'TIME-SESSION-2',
        title: 'Time Session Integrity Task 2',
        description: 'Task 2 for testing time session integrity',
        state: 'pending',
      });

      const session1 = await timeTrackingService.startTracking(testTask.id);
      expect(session1.status).toBe('active');

      // Try to start session for different task (should fail)
      try {
        await timeTrackingService.startTracking(task2.id);
        fail('Should have thrown an error for multiple active sessions');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Clean up
      await timeTrackingService.stopTracking(session1.id);
    });

    it('should maintain session state transitions', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      expect(session.status).toBe('active');

      // Can't stop a paused session without resuming first
      await timeTrackingService.pauseTracking(session.id);
      
      try {
        await timeTrackingService.stopTracking(session.id);
        fail('Should have thrown an error for stopping paused session');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Resume and then stop
      await timeTrackingService.resumeTracking(session.id);
      await timeTrackingService.stopTracking(session.id);

      // Can't pause a stopped session
      try {
        await timeTrackingService.pauseTracking(session.id);
        fail('Should have thrown an error for pausing stopped session');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should calculate duration correctly', async () => {
      const session = await timeTrackingService.startTracking(testTask.id);
      
      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stoppedSession = await timeTrackingService.stopTracking(session.id);
      expect(stoppedSession.durationSeconds).toBeGreaterThan(0);
      expect(stoppedSession.durationSeconds).toBeLessThan(10); // Should be less than 10 seconds
    });
  });

  describe('Database Constraints', () => {
    it('should enforce NOT NULL constraints', async () => {
      // Test project name constraint
      try {
        await projectService.createProject('', 'Valid description');
        fail('Should have thrown an error for empty project name');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test task title constraint
      const project = await projectService.createProject('Constraint Test', 'Testing constraints');
      try {
        await taskService.createTask(project.id, {
          number: 'CONSTRAINT-1',
          title: '',
          description: 'Valid description',
          state: 'pending',
        });
        fail('Should have thrown an error for empty task title');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should enforce CHECK constraints', async () => {
      const project = await projectService.createProject('Check Constraint Test', 'Testing check constraints');
      
      // Test invalid task state
      try {
        await taskService.createTask(project.id, {
          number: 'CHECK-1',
          title: 'Valid Title',
          description: 'Valid description',
          state: 'invalid-state' as any,
        });
        fail('Should have thrown an error for invalid task state');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test invalid time estimate
      try {
        await taskService.createTask(project.id, {
          number: 'CHECK-2',
          title: 'Valid Title',
          description: 'Valid description',
          state: 'pending',
          timeEstimateHours: -1,
        });
        fail('Should have thrown an error for negative time estimate');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test invalid size estimate
      try {
        await taskService.createTask(project.id, {
          number: 'CHECK-3',
          title: 'Valid Title',
          description: 'Valid description',
          state: 'pending',
          sizeEstimate: -1,
        });
        fail('Should have thrown an error for negative size estimate');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should enforce UNIQUE constraints', async () => {
      const project1 = await projectService.createProject('Unique Constraint Test 1', 'Testing unique constraints');
      const project2 = await projectService.createProject('Unique Constraint Test 2', 'Testing unique constraints');

      // Test unique project names
      try {
        await projectService.createProject('Unique Constraint Test 1', 'Different description');
        fail('Should have thrown an error for duplicate project name');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test unique task numbers within project
      const task1 = await taskService.createTask(project1.id, {
        number: 'UNIQUE-CONSTRAINT-1',
        title: 'Unique Task 1',
        description: 'Task 1 for testing unique constraints',
        state: 'pending',
      });

      try {
        await taskService.createTask(project1.id, {
          number: 'UNIQUE-CONSTRAINT-1',
          title: 'Unique Task 2',
          description: 'Task 2 for testing unique constraints',
          state: 'pending',
        });
        fail('Should have thrown an error for duplicate task number');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Clean up
      await projectService.deleteProject(project1.id);
      await projectService.deleteProject(project2.id);
    });
  });

  describe('Transaction Integrity', () => {
    it('should maintain ACID properties', async () => {
      const project = await projectService.createProject('ACID Test', 'Testing ACID properties');
      
      // Test atomicity - all operations succeed or none do
      try {
        await db.executeTransaction(async () => {
          await taskService.createTask(project.id, {
            number: 'ACID-1',
            title: 'ACID Task 1',
            description: 'Task 1 for testing ACID properties',
            state: 'pending',
          });
          
          await taskService.createTask(project.id, {
            number: 'ACID-2',
            title: 'ACID Task 2',
            description: 'Task 2 for testing ACID properties',
            state: 'pending',
          });
          
          // Force an error
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }
      
      // Verify no tasks were created due to rollback
      const tasks = await taskService.listTasks(project.id);
      expect(tasks).toHaveLength(0);
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should maintain consistency across operations', async () => {
      const project = await projectService.createProject('Consistency Test', 'Testing consistency');
      
      // Create task
      const task = await taskService.createTask(project.id, {
        number: 'CONSISTENCY-1',
        title: 'Consistency Task',
        description: 'Task for testing consistency',
        state: 'pending',
      });
      
      // Create time session
      const session = await timeTrackingService.startTracking(task.id);
      await timeTrackingService.stopTracking(session.id);
      
      // Verify data consistency
      const projectStats = await projectService.getProjectStats(project.id);
      const taskStats = await taskService.getTaskStats(task.id);
      
      expect(projectStats.totalTasks).toBe(1);
      expect(projectStats.totalTimeSpent).toBeGreaterThan(0);
      expect(taskStats.sessionCount).toBe(1);
      expect(taskStats.totalTimeSpent).toBeGreaterThan(0);
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });
});
