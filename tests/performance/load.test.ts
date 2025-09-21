import { DatabaseConnection } from '../../src/database/connection';
import { ProjectService } from '../../src/services/ProjectService';
import { TaskService } from '../../src/services/TaskService';
import { TimeTrackingService } from '../../src/services/TimeTrackingService';
import { ProjectRepository } from '../../src/repositories/ProjectRepository';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { TaskTagRepository } from '../../src/repositories/TaskTagRepository';
import { TimeSessionRepository } from '../../src/repositories/TimeSessionRepository';
import { performanceMonitor } from '../../src/utils/performance';

describe('Performance Tests', () => {
  let db: DatabaseConnection;
  let projectService: ProjectService;
  let taskService: TaskService;
  let timeTrackingService: TimeTrackingService;

  beforeAll(async () => {
    // Initialize database connection
    db = new DatabaseConnection();
    await db.connect({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'ptc_user',
      password: process.env.DB_PASSWORD || 'ptc_password',
      database: process.env.DB_NAME || 'ptc_db',
      ssl: false,
      connectionLimit: 10,
      acquireTimeout: 10000,
      timeout: 10000,
    });

    // Initialize services
    const projectRepo = new ProjectRepository(db);
    const taskRepo = new TaskRepository(db);
    const taskTagRepo = new TaskTagRepository(db);
    const timeSessionRepo = new TimeSessionRepository(db);

    projectService = new ProjectService(projectRepo);
    taskService = new TaskService(taskRepo, taskTagRepo);
    timeTrackingService = new TimeTrackingService(timeSessionRepo);
  });

  afterAll(async () => {
    if (db) {
      await db.disconnect();
    }
  });

  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('Large Dataset Performance', () => {
    it('should handle 1000+ projects efficiently', async () => {
      const startTime = Date.now();
      
      // Create 1000 projects
      const projects = [];
      for (let i = 0; i < 1000; i++) {
        const project = await projectService.createProject(`project-${i}`, `Description for project ${i}`);
        projects.push(project);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      // List all projects should be fast
      const listStartTime = Date.now();
      const allProjects = await projectService.listProjects();
      const listEndTime = Date.now();
      const listDuration = listEndTime - listStartTime;
      
      expect(allProjects.length).toBeGreaterThanOrEqual(1000);
      expect(listDuration).toBeLessThan(1000); // Should complete within 1 second
    }, 30000);

    it('should handle 10000+ tasks efficiently', async () => {
      // Create a test project
      const project = await projectService.createProject('load-test-project', 'Project for load testing');
      
      const startTime = Date.now();
      
      // Create 10000 tasks
      const tasks = [];
      for (let i = 0; i < 10000; i++) {
        const task = await taskService.createTask(project.id, {
          number: `TASK-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          state: 'pending',
          sizeEstimate: Math.floor(Math.random() * 10) + 1,
          timeEstimateHours: Math.random() * 8 + 1,
          tags: [`tag-${i % 100}`],
        });
        tasks.push(task);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      // List tasks should be fast
      const listStartTime = Date.now();
      const allTasks = await taskService.listTasks(project.id);
      const listEndTime = Date.now();
      const listDuration = listEndTime - listStartTime;
      
      expect(allTasks.length).toBeGreaterThanOrEqual(10000);
      expect(listDuration).toBeLessThan(2000); // Should complete within 2 seconds
    }, 60000);

    it('should handle 100000+ time sessions efficiently', async () => {
      // Create a test project and task
      const project = await projectService.createProject('time-session-test', 'Project for time session testing');
      const task = await taskService.createTask(project.id, {
        number: 'TIME-TASK-1',
        title: 'Time tracking task',
        state: 'in-progress',
      });
      
      const startTime = Date.now();
      
      // Create 100000 time sessions
      const sessions = [];
      for (let i = 0; i < 100000; i++) {
        const sessionStart = new Date(Date.now() - Math.random() * 86400000 * 30); // Random time in last 30 days
        const sessionEnd = new Date(sessionStart.getTime() + Math.random() * 3600000); // Random duration up to 1 hour
        
        const session = await timeTrackingService.startTracking(task.id, sessionStart);
        await timeTrackingService.stopTracking(session.id, sessionEnd);
        sessions.push(session);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      // Get sessions should be fast
      const getStartTime = Date.now();
      const allSessions = await timeTrackingService.getSessionsByTask(task.id);
      const getEndTime = Date.now();
      const getDuration = getEndTime - getStartTime;
      
      expect(allSessions.length).toBeGreaterThanOrEqual(100000);
      expect(getDuration).toBeLessThan(3000); // Should complete within 3 seconds
    }, 120000);
  });

  describe('Query Performance', () => {
    it('should execute simple queries within 10ms', async () => {
      const metrics = await performanceMonitor.measureAsync('simple-query', async () => {
        await projectService.listProjects();
      });
      
      expect(metrics.duration).toBeLessThan(10);
    });

    it('should execute complex queries within 100ms', async () => {
      // Create test data
      const project = await projectService.createProject('complex-query-test', 'Project for complex query testing');
      
      for (let i = 0; i < 100; i++) {
        await taskService.createTask(project.id, {
          number: `COMPLEX-${i}`,
          title: `Complex task ${i}`,
          state: i % 2 === 0 ? 'completed' : 'in-progress',
          tags: [`complex-tag-${i % 10}`],
        });
      }
      
      const metrics = await performanceMonitor.measureAsync('complex-query', async () => {
        await taskService.listTasks(project.id, {
          state: 'completed',
          tags: ['complex-tag-1'],
        });
      });
      
      expect(metrics.duration).toBeLessThan(100);
    });

    it('should handle concurrent operations efficiently', async () => {
      const project = await projectService.createProject('concurrent-test', 'Project for concurrent testing');
      
      const startTime = Date.now();
      
      // Run 100 concurrent operations
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          taskService.createTask(project.id, {
            number: `CONCURRENT-${i}`,
            title: `Concurrent task ${i}`,
            state: 'pending',
          })
        );
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory limits during bulk operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create large dataset
      const project = await projectService.createProject('memory-test', 'Project for memory testing');
      
      for (let i = 0; i < 1000; i++) {
        await taskService.createTask(project.id, {
          number: `MEMORY-${i}`,
          title: `Memory test task ${i}`,
          description: 'A'.repeat(1000), // Large description
        });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle memory cleanup properly', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create and delete large dataset
      const project = await projectService.createProject('cleanup-test', 'Project for cleanup testing');
      
      const tasks = [];
      for (let i = 0; i < 500; i++) {
        const task = await taskService.createTask(project.id, {
          number: `CLEANUP-${i}`,
          title: `Cleanup test task ${i}`,
        });
        tasks.push(task);
      }
      
      // Delete all tasks
      for (const task of tasks) {
        await taskService.deleteTask(task.id);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should be cleaned up (increase should be minimal)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics correctly', async () => {
      await performanceMonitor.measureAsync('test-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      const testMetrics = metrics.find(m => m.operation === 'test-operation');
      expect(testMetrics).toBeDefined();
      expect(testMetrics!.duration).toBeGreaterThan(90);
      expect(testMetrics!.duration).toBeLessThan(200);
    });

    it('should identify slow operations', async () => {
      await performanceMonitor.measureAsync('slow-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      
      const slowOps = performanceMonitor.getSlowOperations(100);
      expect(slowOps.length).toBeGreaterThan(0);
      
      const slowOp = slowOps.find(op => op.operation === 'slow-operation');
      expect(slowOp).toBeDefined();
    });
  });
});