import { OutputUtils } from '../../../src/cli/utils/output';
import chalk from 'chalk';

// Mock chalk to avoid color output in tests
jest.mock('chalk', () => ({
  blue: jest.fn(() => 'blue'),
  green: jest.fn(() => 'green'),
  yellow: jest.fn(() => 'yellow'),
  red: jest.fn(() => 'red'),
  gray: jest.fn(() => 'gray'),
  bold: jest.fn(() => 'bold'),
  white: jest.fn(() => 'white'),
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('OutputUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('success', () => {
    it('should log success message', () => {
      OutputUtils.success('Test success message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Test success message'));
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      OutputUtils.info('Test info message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
    });
  });

  describe('warning', () => {
    it('should log warning message', () => {
      OutputUtils.warning('Test warning message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Test warning message'));
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      OutputUtils.error('Test error message');
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Test error message'));
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      OutputUtils.debug('Test debug message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Test debug message'));
    });
  });

  describe('verboseLog', () => {
    it('should log verbose message', () => {
      OutputUtils.verboseLog('Test verbose message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Test verbose message'));
    });
  });

  describe('displayProjects', () => {
    it('should display projects in table format', () => {
      const projects = [
        {
          id: 1,
          name: 'Project 1',
          description: 'First project',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
        {
          id: 2,
          name: 'Project 2',
          description: 'Second project',
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-04'),
        },
      ];

      OutputUtils.displayProjects(projects);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should display projects in JSON format', () => {
      const projects = [
        {
          id: 1,
          name: 'Project 1',
          description: 'First project',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      OutputUtils.displayProjects(projects, 'json');
      expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(projects, null, 2));
    });

    it('should display info message when no projects', () => {
      OutputUtils.displayProjects([]);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No projects found'));
    });
  });

  describe('displayProjectDetails', () => {
    it('should display project details', () => {
      const project = {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      const stats = {
        id: 1,
        name: 'Test Project',
        totalTasks: 5,
        completedTasks: 3,
        totalTimeSpent: 7200,
        averageTaskTime: 1440,
        lastActivity: new Date('2023-01-02'),
      };

      OutputUtils.displayProjectDetails(project, stats);
      expect(mockConsoleLog).toHaveBeenCalledTimes(8); // Multiple log calls for different sections
    });
  });

  describe('displayTasks', () => {
    it('should display tasks in table format', () => {
      const tasks = [
        {
          id: 1,
          projectId: 1,
          number: 'TASK-1',
          title: 'Test Task 1',
          state: 'pending',
          timeEstimateHours: 2,
          tags: ['test', 'feature'],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
        {
          id: 2,
          projectId: 1,
          number: 'TASK-2',
          title: 'Test Task 2',
          state: 'completed',
          timeEstimateHours: 1,
          tags: ['bug'],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-03'),
        },
      ];

      OutputUtils.displayTasks(tasks);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should display tasks in JSON format', () => {
      const tasks = [
        {
          id: 1,
          projectId: 1,
          number: 'TASK-1',
          title: 'Test Task 1',
          state: 'pending',
          timeEstimateHours: 2,
          tags: ['test', 'feature'],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      OutputUtils.displayTasks(tasks, 'json');
      expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(tasks, null, 2));
    });

    it('should display info message when no tasks', () => {
      OutputUtils.displayTasks([]);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No tasks found'));
    });
  });

  describe('displayTaskDetails', () => {
    it('should display task details', () => {
      const task = {
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        description: 'A test task',
        state: 'in-progress',
        sizeEstimate: 2,
        timeEstimateHours: 2,
        tags: ['test', 'feature'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      const stats = {
        id: 1,
        number: 'TASK-1',
        title: 'Test Task',
        state: 'in-progress',
        totalTimeSpent: 3600,
        sessionCount: 3,
        averageSessionTime: 1200,
        lastActivity: new Date('2023-01-02'),
      };

      OutputUtils.displayTaskDetails(task, stats);
      expect(mockConsoleLog).toHaveBeenCalledTimes(12); // Multiple log calls for different sections
    });

    it('should display task details without stats', () => {
      const task = {
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        state: 'pending',
        tags: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      OutputUtils.displayTaskDetails(task);
      expect(mockConsoleLog).toHaveBeenCalledTimes(6); // Fewer log calls without stats
    });
  });

  describe('displayTimeSessions', () => {
    it('should display time sessions in table format', () => {
      const sessions = [
        {
          id: 1,
          taskId: 1,
          startedAt: new Date('2023-01-01T10:00:00Z'),
          durationSeconds: 3600,
          status: 'stopped',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 2,
          taskId: 1,
          startedAt: new Date('2023-01-01T14:00:00Z'),
          durationSeconds: 1800,
          status: 'active',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      OutputUtils.displayTimeSessions(sessions);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should display time sessions in JSON format', () => {
      const sessions = [
        {
          id: 1,
          taskId: 1,
          startedAt: new Date('2023-01-01T10:00:00Z'),
          durationSeconds: 3600,
          status: 'stopped',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      OutputUtils.displayTimeSessions(sessions, 'json');
      expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(sessions, null, 2));
    });

    it('should display info message when no sessions', () => {
      OutputUtils.displayTimeSessions([]);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No time sessions found'));
    });
  });

  describe('displayTimeReport', () => {
    it('should display time report', () => {
      const report = {
        summary: {
          totalTimeFormatted: '2h 30m',
          sessionCount: 5,
          averageSessionTimeFormatted: '30m',
          longestSessionFormatted: '1h 15m',
          shortestSessionFormatted: '15m',
        },
      };

      OutputUtils.displayTimeReport(report);
      expect(mockConsoleLog).toHaveBeenCalledTimes(6); // Multiple log calls for different sections
    });
  });

  describe('displayVelocityReport', () => {
    it('should display velocity report', () => {
      const report = {
        summary: {
          period: 'week',
          totalTasks: 10,
          completedTasks: 8,
          velocity: 8.0,
          throughput: 1.14,
          completionRate: 80.0,
          productivityScore: 85.0,
        },
      };

      OutputUtils.displayVelocityReport(report);
      expect(mockConsoleLog).toHaveBeenCalledTimes(7); // Multiple log calls for different sections
    });
  });

  describe('displayEstimationReport', () => {
    it('should display estimation report', () => {
      const report = {
        summary: {
          totalTasks: 20,
          tasksWithEstimates: 15,
          estimationCoverage: 75.0,
          timeAccuracy: 85.0,
          timeBias: 5.0,
          estimationQuality: 'Good',
          recommendations: [
            'Consider breaking down large tasks',
            'Review estimation process',
          ],
        },
      };

      OutputUtils.displayEstimationReport(report);
      expect(mockConsoleLog).toHaveBeenCalledTimes(8); // Multiple log calls for different sections
    });
  });
});