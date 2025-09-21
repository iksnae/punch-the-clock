import { DatabaseConnection } from '../../src/database/connection';
import { DatabaseConfig } from '../../src/database/types';
import { ProjectService } from '../../src/services/ProjectService';
import { TaskService } from '../../src/services/TaskService';
import { TimeTrackingService } from '../../src/services/TimeTrackingService';
import { ReportingService } from '../../src/services/ReportingService';
import { ProjectRepository } from '../../src/repositories/ProjectRepository';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { TaskTagRepository } from '../../src/repositories/TaskTagRepository';
import { TimeSessionRepository } from '../../src/repositories/TimeSessionRepository';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance and Load Tests', () => {
  let db: DatabaseConnection;
  let projectService: ProjectService;
  let taskService: TaskService;
  let timeTrackingService: TimeTrackingService;
  let reportingService: ReportingService;
  const testDbPath = path.join(__dirname, '../test-db.sqlite');

  const testConfig: DatabaseConfig = {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'test_ptc',
    connectionLimit: 10,
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
    reportingService = new ReportingService(projectService, taskService, timeTrackingService);
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

  describe('Database Performance', () => {
    it('should handle large number of projects efficiently', async () => {
      const startTime = Date.now();
      const projectPromises = [];
      
      // Create 100 projects concurrently
      for (let i = 1; i <= 100; i++) {
        projectPromises.push(
          projectService.createProject(`Performance Project ${i}`, `Project ${i} for performance testing`)
        );
      }
      
      const projects = await Promise.all(projectPromises);
      const endTime = Date.now();
      
      expect(projects).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Test listing all projects
      const listStartTime = Date.now();
      const allProjects = await projectService.listProjects();
      const listEndTime = Date.now();
      
      expect(allProjects.length).toBeGreaterThanOrEqual(100);
      expect(listEndTime - listStartTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Clean up
      const deletePromises = projects.map(project => projectService.deleteProject(project.id));
      await Promise.all(deletePromises);
    });

    it('should handle large number of tasks efficiently', async () => {
      const project = await projectService.createProject('Task Performance Test', 'For testing task performance');
      
      const startTime = Date.now();
      const taskPromises = [];
      
      // Create 500 tasks concurrently
      for (let i = 1; i <= 500; i++) {
        taskPromises.push(
          taskService.createTask(project.id, {
            number: `PERF-${i}`,
            title: `Performance Task ${i}`,
            description: `Task ${i} for performance testing`,
            state: 'pending',
            tags: [`tag${i % 10}`, `category${i % 5}`],
          })
        );
      }
      
      const tasks = await Promise.all(taskPromises);
      const endTime = Date.now();
      
      expect(tasks).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      // Test listing all tasks
      const listStartTime = Date.now();
      const allTasks = await taskService.listTasks(project.id);
      const listEndTime = Date.now();
      
      expect(allTasks.length).toBe(500);
      expect(listEndTime - listStartTime).toBeLessThan(3000); // Should complete within 3 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should handle large number of time sessions efficiently', async () => {
      const project = await projectService.createProject('Time Session Performance Test', 'For testing time session performance');
      const task = await taskService.createTask(project.id, {
        number: 'TIME-PERF-1',
        title: 'Time Session Performance Task',
        description: 'Task for time session performance testing',
        state: 'pending',
      });
      
      const startTime = Date.now();
      const sessionPromises = [];
      
      // Create 200 time sessions concurrently
      for (let i = 1; i <= 200; i++) {
        sessionPromises.push(
          timeTrackingService.startTracking(task.id)
            .then(session => timeTrackingService.stopTracking(session.id))
        );
      }
      
      const sessions = await Promise.all(sessionPromises);
      const endTime = Date.now();
      
      expect(sessions).toHaveLength(200);
      expect(endTime - startTime).toBeLessThan(20000); // Should complete within 20 seconds
      
      // Test listing all sessions
      const listStartTime = Date.now();
      const allSessions = await timeTrackingService.listSessions({ taskId: task.id });
      const listEndTime = Date.now();
      
      expect(allSessions.length).toBe(200);
      expect(listEndTime - listStartTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should handle concurrent database operations efficiently', async () => {
      const project = await projectService.createProject('Concurrent Operations Test', 'For testing concurrent operations');
      
      const startTime = Date.now();
      
      // Run multiple operations concurrently
      const operations = [
        // Create tasks
        ...Array.from({ length: 50 }, (_, i) =>
          taskService.createTask(project.id, {
            number: `CONC-${i + 1}`,
            title: `Concurrent Task ${i + 1}`,
            description: `Task ${i + 1} for concurrent testing`,
            state: 'pending',
          })
        ),
        // Update project
        projectService.updateProject(project.id, { description: 'Updated description' }),
        // Get project stats
        projectService.getProjectStats(project.id),
      ];
      
      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      expect(results.length).toBe(52); // 50 tasks + 1 update + 1 stats
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });

  describe('Service Performance', () => {
    it('should handle large project statistics efficiently', async () => {
      const project = await projectService.createProject('Stats Performance Test', 'For testing stats performance');
      
      // Create many tasks with time sessions
      const tasks = [];
      for (let i = 1; i <= 100; i++) {
        const task = await taskService.createTask(project.id, {
          number: `STATS-${i}`,
          title: `Stats Task ${i}`,
          description: `Task ${i} for stats testing`,
          state: 'completed',
        });
        tasks.push(task);
        
        // Create time sessions for each task
        for (let j = 1; j <= 5; j++) {
          const session = await timeTrackingService.startTracking(task.id);
          await timeTrackingService.stopTracking(session.id);
        }
      }
      
      const startTime = Date.now();
      const stats = await projectService.getProjectStats(project.id);
      const endTime = Date.now();
      
      expect(stats.totalTasks).toBe(100);
      expect(stats.completedTasks).toBe(100);
      expect(stats.totalTimeSpent).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should handle large task statistics efficiently', async () => {
      const project = await projectService.createProject('Task Stats Performance Test', 'For testing task stats performance');
      const task = await taskService.createTask(project.id, {
        number: 'TASK-STATS-1',
        title: 'Task Stats Performance Task',
        description: 'Task for stats performance testing',
        state: 'completed',
      });
      
      // Create many time sessions
      for (let i = 1; i <= 100; i++) {
        const session = await timeTrackingService.startTracking(task.id);
        await timeTrackingService.stopTracking(session.id);
      }
      
      const startTime = Date.now();
      const stats = await taskService.getTaskStats(task.id);
      const endTime = Date.now();
      
      expect(stats.sessionCount).toBe(100);
      expect(stats.totalTimeSpent).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should handle large tag operations efficiently', async () => {
      const project = await projectService.createProject('Tag Performance Test', 'For testing tag performance');
      
      // Create tasks with many tags
      const tasks = [];
      for (let i = 1; i <= 100; i++) {
        const task = await taskService.createTask(project.id, {
          number: `TAG-${i}`,
          title: `Tag Task ${i}`,
          description: `Task ${i} for tag testing`,
          state: 'pending',
          tags: Array.from({ length: 10 }, (_, j) => `tag${j}`),
        });
        tasks.push(task);
      }
      
      const startTime = Date.now();
      const allTags = await taskService.getAllTags();
      const endTime = Date.now();
      
      expect(allTags.length).toBe(10); // Should have 10 unique tags
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Test tag stats
      const statsStartTime = Date.now();
      const tagStats = await taskService.getTagStats();
      const statsEndTime = Date.now();
      
      expect(tagStats.length).toBe(10);
      expect(statsEndTime - statsStartTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });

  describe('Reporting Performance', () => {
    it('should generate time reports efficiently for large datasets', async () => {
      const project = await projectService.createProject('Time Report Performance Test', 'For testing time report performance');
      
      // Create many tasks with time sessions
      const tasks = [];
      for (let i = 1; i <= 50; i++) {
        const task = await taskService.createTask(project.id, {
          number: `TIME-REPORT-${i}`,
          title: `Time Report Task ${i}`,
          description: `Task ${i} for time report testing`,
          state: 'completed',
        });
        tasks.push(task);
        
        // Create multiple time sessions for each task
        for (let j = 1; j <= 10; j++) {
          const session = await timeTrackingService.startTracking(task.id);
          await timeTrackingService.stopTracking(session.id);
        }
      }
      
      const startTime = Date.now();
      const report = await reportingService.generateTimeReport({
        projectId: project.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date(),
      });
      const endTime = Date.now();
      
      expect(report.summary.sessionCount).toBe(500); // 50 tasks * 10 sessions
      expect(report.summary.totalTime).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should generate velocity reports efficiently for large datasets', async () => {
      const project = await projectService.createProject('Velocity Report Performance Test', 'For testing velocity report performance');
      
      // Create many tasks with different states
      const taskStates = ['completed', 'completed', 'completed', 'in-progress', 'pending'];
      for (let i = 1; i <= 200; i++) {
        await taskService.createTask(project.id, {
          number: `VEL-REPORT-${i}`,
          title: `Velocity Report Task ${i}`,
          description: `Task ${i} for velocity report testing`,
          state: taskStates[i % 5] as any,
        });
      }
      
      const startTime = Date.now();
      const report = await reportingService.generateVelocityReport({
        projectId: project.id,
        period: 'month',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });
      const endTime = Date.now();
      
      expect(report.summary.totalTasks).toBe(200);
      expect(report.summary.completedTasks).toBe(120); // 3/5 of 200
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });

    it('should generate estimation reports efficiently for large datasets', async () => {
      const project = await projectService.createProject('Estimation Report Performance Test', 'For testing estimation report performance');
      
      // Create many tasks with estimates and time sessions
      for (let i = 1; i <= 100; i++) {
        const task = await taskService.createTask(project.id, {
          number: `EST-REPORT-${i}`,
          title: `Estimation Report Task ${i}`,
          description: `Task ${i} for estimation report testing`,
          state: 'completed',
          timeEstimateHours: i % 10 + 1, // 1-10 hours
        });
        
        // Create time sessions
        for (let j = 1; j <= 3; j++) {
          const session = await timeTrackingService.startTracking(task.id);
          await timeTrackingService.stopTracking(session.id);
        }
      }
      
      const startTime = Date.now();
      const report = await reportingService.generateEstimationReport({
        projectId: project.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });
      const endTime = Date.now();
      
      expect(report.summary.totalTasks).toBe(100);
      expect(report.summary.tasksWithEstimates).toBe(100);
      expect(report.summary.estimationCoverage).toBe(100);
      expect(endTime - startTime).toBeLessThan(4000); // Should complete within 4 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });

  describe('Memory Usage', () => {
    it('should handle large datasets without excessive memory usage', async () => {
      const project = await projectService.createProject('Memory Test', 'For testing memory usage');
      
      // Create many tasks
      const tasks = [];
      for (let i = 1; i <= 1000; i++) {
        const task = await taskService.createTask(project.id, {
          number: `MEM-${i}`,
          title: `Memory Test Task ${i}`,
          description: `Task ${i} for memory testing`,
          state: 'pending',
        });
        tasks.push(task);
      }
      
      // List all tasks to ensure they can be loaded into memory
      const allTasks = await taskService.listTasks(project.id);
      expect(allTasks.length).toBe(1000);
      
      // Generate reports to test memory usage
      const timeReport = await reportingService.generateTimeReport({
        projectId: project.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });
      
      const velocityReport = await reportingService.generateVelocityReport({
        projectId: project.id,
        period: 'month',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });
      
      expect(timeReport).toBeDefined();
      expect(velocityReport).toBeDefined();
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle high concurrent connection usage', async () => {
      const project = await projectService.createProject('Connection Pool Test', 'For testing connection pool');
      
      // Create many concurrent operations that will use the connection pool
      const operations = [];
      for (let i = 1; i <= 100; i++) {
        operations.push(
          taskService.createTask(project.id, {
            number: `POOL-${i}`,
            title: `Connection Pool Task ${i}`,
            description: `Task ${i} for connection pool testing`,
            state: 'pending',
          })
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      expect(results.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });

  describe('Query Performance', () => {
    it('should handle complex queries efficiently', async () => {
      const project = await projectService.createProject('Query Performance Test', 'For testing query performance');
      
      // Create tasks with various properties
      for (let i = 1; i <= 100; i++) {
        await taskService.createTask(project.id, {
          number: `QUERY-${i}`,
          title: `Query Task ${i}`,
          description: `Task ${i} for query testing`,
          state: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in-progress' : 'pending',
          tags: [`tag${i % 5}`, `category${i % 3}`],
          timeEstimateHours: i % 10 + 1,
        });
      }
      
      // Test complex queries
      const startTime = Date.now();
      
      const completedTasks = await taskService.getTasksByState(project.id, 'completed');
      const inProgressTasks = await taskService.getTasksByState(project.id, 'in-progress');
      const pendingTasks = await taskService.getTasksByState(project.id, 'pending');
      
      const tasksByTag = await taskService.getTasksByTag(project.id, 'tag1');
      const recentTasks = await taskService.getRecentTasks(project.id, 10);
      const activeTasks = await taskService.getActiveTasks(project.id);
      
      const endTime = Date.now();
      
      expect(completedTasks.length).toBe(33); // ~1/3 of 100
      expect(inProgressTasks.length).toBe(33); // ~1/3 of 100
      expect(pendingTasks.length).toBe(34); // ~1/3 of 100
      expect(tasksByTag.length).toBe(20); // 1/5 of 100
      expect(recentTasks.length).toBe(10);
      expect(activeTasks.length).toBe(33);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      
      // Clean up
      await projectService.deleteProject(project.id);
    });
  });
});
