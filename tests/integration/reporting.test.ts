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

describe('Reporting Integration Tests', () => {
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

  describe('Time Reports', () => {
    let testProject: any;
    let testTasks: any[] = [];

    beforeEach(async () => {
      testProject = await projectService.createProject('Time Report Test', 'For testing time reports');
      
      // Create test tasks
      for (let i = 1; i <= 3; i++) {
        const task = await taskService.createTask(testProject.id, {
          number: `TIME-${i}`,
          title: `Time Test Task ${i}`,
          description: `Task ${i} for time reporting`,
          state: 'completed',
          timeEstimateHours: i, // 1, 2, 3 hours
        });
        testTasks.push(task);
      }
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
      testTasks = [];
    });

    it('should generate time report for project', async () => {
      // Create some time sessions
      for (const task of testTasks) {
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateTimeReport({
        projectId: testProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTime).toBeGreaterThan(0);
      expect(report.summary.sessionCount).toBe(3);
      expect(report.summary.averageSessionTime).toBeGreaterThan(0);
      expect(report.summary.longestSession).toBeGreaterThan(0);
      expect(report.summary.shortestSession).toBeGreaterThan(0);
      expect(report.summary.totalTimeFormatted).toBeDefined();
      expect(report.summary.averageSessionTimeFormatted).toBeDefined();
      expect(report.summary.longestSessionFormatted).toBeDefined();
      expect(report.summary.shortestSessionFormatted).toBeDefined();
    });

    it('should generate time report for specific task', async () => {
      const task = testTasks[0];
      
      // Create multiple sessions for the task
      for (let i = 0; i < 3; i++) {
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 50));
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateTimeReport({
        taskId: task.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.sessionCount).toBe(3);
      expect(report.summary.totalTime).toBeGreaterThan(0);
    });

    it('should generate time report for date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create sessions
      for (const task of testTasks) {
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateTimeReport({
        projectId: testProject.id,
        startDate: yesterday,
        endDate: tomorrow,
      });

      expect(report).toBeDefined();
      expect(report.summary.sessionCount).toBe(3);
    });

    it('should generate time report with tags filter', async () => {
      // Add tags to tasks
      await taskService.setTags(testTasks[0].id, ['frontend', 'ui']);
      await taskService.setTags(testTasks[1].id, ['backend', 'api']);
      await taskService.setTags(testTasks[2].id, ['frontend', 'api']);

      // Create sessions
      for (const task of testTasks) {
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateTimeReport({
        projectId: testProject.id,
        tags: ['frontend'],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.sessionCount).toBe(2); // Only tasks with 'frontend' tag
    });

    it('should handle empty time report', async () => {
      const report = await reportingService.generateTimeReport({
        projectId: testProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.totalTime).toBe(0);
      expect(report.summary.sessionCount).toBe(0);
      expect(report.summary.averageSessionTime).toBe(0);
      expect(report.summary.longestSession).toBe(0);
      expect(report.summary.shortestSession).toBe(0);
    });
  });

  describe('Velocity Reports', () => {
    let testProject: any;
    let testTasks: any[] = [];

    beforeEach(async () => {
      testProject = await projectService.createProject('Velocity Report Test', 'For testing velocity reports');
      
      // Create test tasks with different states
      const taskStates = ['completed', 'completed', 'completed', 'in-progress', 'pending'];
      for (let i = 1; i <= 5; i++) {
        const task = await taskService.createTask(testProject.id, {
          number: `VEL-${i}`,
          title: `Velocity Test Task ${i}`,
          description: `Task ${i} for velocity reporting`,
          state: taskStates[i - 1] as any,
          timeEstimateHours: i,
        });
        testTasks.push(task);
      }
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
      testTasks = [];
    });

    it('should generate velocity report for project', async () => {
      const report = await reportingService.generateVelocityReport({
        projectId: testProject.id,
        period: 'week',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.period).toBe('week');
      expect(report.summary.totalTasks).toBe(5);
      expect(report.summary.completedTasks).toBe(3);
      expect(report.summary.velocity).toBeGreaterThan(0);
      expect(report.summary.throughput).toBeGreaterThan(0);
      expect(report.summary.completionRate).toBeGreaterThan(0);
      expect(report.summary.productivityScore).toBeGreaterThan(0);
    });

    it('should generate velocity report for different periods', async () => {
      const periods = ['day', 'week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        const report = await reportingService.generateVelocityReport({
          projectId: testProject.id,
          period: period as any,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        });

        expect(report).toBeDefined();
        expect(report.summary.period).toBe(period);
        expect(report.summary.totalTasks).toBe(5);
        expect(report.summary.completedTasks).toBe(3);
      }
    });

    it('should generate velocity report with date range', async () => {
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const report = await reportingService.generateVelocityReport({
        projectId: testProject.id,
        period: 'week',
        startDate,
        endDate,
      });

      expect(report).toBeDefined();
      expect(report.summary.period).toBe('week');
    });

    it('should handle empty velocity report', async () => {
      const emptyProject = await projectService.createProject('Empty Project', 'No tasks');
      
      const report = await reportingService.generateVelocityReport({
        projectId: emptyProject.id,
        period: 'week',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.totalTasks).toBe(0);
      expect(report.summary.completedTasks).toBe(0);
      expect(report.summary.velocity).toBe(0);
      expect(report.summary.throughput).toBe(0);
      expect(report.summary.completionRate).toBe(0);
      expect(report.summary.productivityScore).toBe(0);
      
      await projectService.deleteProject(emptyProject.id);
    });
  });

  describe('Estimation Reports', () => {
    let testProject: any;
    let testTasks: any[] = [];

    beforeEach(async () => {
      testProject = await projectService.createProject('Estimation Report Test', 'For testing estimation reports');
      
      // Create test tasks with different estimates
      for (let i = 1; i <= 5; i++) {
        const task = await taskService.createTask(testProject.id, {
          number: `EST-${i}`,
          title: `Estimation Test Task ${i}`,
          description: `Task ${i} for estimation reporting`,
          state: 'completed',
          timeEstimateHours: i, // 1, 2, 3, 4, 5 hours
        });
        testTasks.push(task);
      }
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
      testTasks = [];
    });

    it('should generate estimation report for project', async () => {
      // Create time sessions with different durations
      for (let i = 0; i < testTasks.length; i++) {
        const task = testTasks[i];
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // Different durations
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateEstimationReport({
        projectId: testProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTasks).toBe(5);
      expect(report.summary.tasksWithEstimates).toBe(5);
      expect(report.summary.estimationCoverage).toBe(100);
      expect(report.summary.timeAccuracy).toBeGreaterThan(0);
      expect(report.summary.timeBias).toBeDefined();
      expect(report.summary.estimationQuality).toBeDefined();
      expect(report.summary.recommendations).toBeDefined();
    });

    it('should generate estimation report for specific task', async () => {
      const task = testTasks[0];
      
      // Create multiple sessions for the task
      for (let i = 0; i < 3; i++) {
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateEstimationReport({
        taskId: task.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.totalTasks).toBe(1);
      expect(report.summary.tasksWithEstimates).toBe(1);
      expect(report.summary.estimationCoverage).toBe(100);
    });

    it('should generate estimation report with tags filter', async () => {
      // Add tags to tasks
      await taskService.setTags(testTasks[0].id, ['frontend']);
      await taskService.setTags(testTasks[1].id, ['backend']);
      await taskService.setTags(testTasks[2].id, ['frontend']);

      // Create sessions
      for (const task of testTasks) {
        const session = await timeTrackingService.startTracking(task.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateEstimationReport({
        projectId: testProject.id,
        tags: ['frontend'],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.totalTasks).toBe(2); // Only tasks with 'frontend' tag
    });

    it('should handle estimation report with no estimates', async () => {
      // Create tasks without estimates
      const noEstimateProject = await projectService.createProject('No Estimates Project', 'Tasks without estimates');
      const task = await taskService.createTask(noEstimateProject.id, {
        number: 'NO-EST-1',
        title: 'No Estimate Task',
        description: 'Task without estimate',
        state: 'completed',
      });

      const session = await timeTrackingService.startTracking(task.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      await timeTrackingService.stopTracking(session.id);

      const report = await reportingService.generateEstimationReport({
        projectId: noEstimateProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.totalTasks).toBe(1);
      expect(report.summary.tasksWithEstimates).toBe(0);
      expect(report.summary.estimationCoverage).toBe(0);
      
      await projectService.deleteProject(noEstimateProject.id);
    });

    it('should provide estimation recommendations', async () => {
      // Create tasks with varying estimation accuracy
      for (let i = 0; i < testTasks.length; i++) {
        const task = testTasks[i];
        const session = await timeTrackingService.startTracking(task.id);
        // Make actual time different from estimate
        const actualTime = (i + 1) * 100 * (i % 2 === 0 ? 0.5 : 2); // Some over, some under
        await new Promise(resolve => setTimeout(resolve, actualTime));
        await timeTrackingService.stopTracking(session.id);
      }

      const report = await reportingService.generateEstimationReport({
        projectId: testProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.summary.recommendations).toBeDefined();
      expect(Array.isArray(report.summary.recommendations)).toBe(true);
    });
  });

  describe('Report Export', () => {
    let testProject: any;

    beforeEach(async () => {
      testProject = await projectService.createProject('Export Test', 'For testing report export');
      
      const task = await taskService.createTask(testProject.id, {
        number: 'EXPORT-1',
        title: 'Export Test Task',
        description: 'Task for export testing',
        state: 'completed',
        timeEstimateHours: 2,
      });

      const session = await timeTrackingService.startTracking(task.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      await timeTrackingService.stopTracking(session.id);
    });

    afterEach(async () => {
      if (testProject) {
        await projectService.deleteProject(testProject.id);
      }
    });

    it('should export time report to JSON', async () => {
      const report = await reportingService.generateTimeReport({
        projectId: testProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      const exportData = reportingService.exportReport(report, 'json');
      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      
      const parsed = JSON.parse(exportData);
      expect(parsed).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });

    it('should export velocity report to CSV', async () => {
      const report = await reportingService.generateVelocityReport({
        projectId: testProject.id,
        period: 'week',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      const exportData = reportingService.exportReport(report, 'csv');
      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      expect(exportData).toContain(',');
    });

    it('should export estimation report to JSON', async () => {
      const report = await reportingService.generateEstimationReport({
        projectId: testProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      const exportData = reportingService.exportReport(report, 'json');
      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      
      const parsed = JSON.parse(exportData);
      expect(parsed).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });
  });
});
