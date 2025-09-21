import { TimeTrackingService } from '../../src/services/TimeTrackingService';
import { TimeSessionRepository } from '../../src/repositories/TimeSessionRepository';
import { TimeSessionModel } from '../../src/models/TimeSession';
import { DatabaseConnection } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');
jest.mock('../../src/repositories/TimeSessionRepository');

describe('TimeTrackingService', () => {
  let timeTrackingService: TimeTrackingService;
  let mockTimeSessionRepository: jest.Mocked<TimeSessionRepository>;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = new DatabaseConnection() as jest.Mocked<DatabaseConnection>;
    mockTimeSessionRepository = new TimeSessionRepository(mockDb) as jest.Mocked<TimeSessionRepository>;
    timeTrackingService = new TimeTrackingService(mockTimeSessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startTracking', () => {
    it('should start time tracking successfully', async () => {
      const mockSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getActiveSession.mockResolvedValue(null);
      mockTimeSessionRepository.getActiveSessionForTask.mockResolvedValue(null);
      mockTimeSessionRepository.create.mockResolvedValue(mockSession);

      const result = await timeTrackingService.startTracking(1);

      expect(mockTimeSessionRepository.getActiveSession).toHaveBeenCalledWith();
      expect(mockTimeSessionRepository.getActiveSessionForTask).toHaveBeenCalledWith(1);
      expect(mockTimeSessionRepository.create).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(mockSession.toJSON());
    });

    it('should throw error if another session is active', async () => {
      const mockActiveSession = new TimeSessionModel({
        id: 1,
        taskId: 2,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getActiveSession.mockResolvedValue(mockActiveSession);

      await expect(timeTrackingService.startTracking(1)).rejects.toThrow(
        'Another time session is already active'
      );
    });

    it('should throw error if task already has active session', async () => {
      const mockActiveSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getActiveSession.mockResolvedValue(null);
      mockTimeSessionRepository.getActiveSessionForTask.mockResolvedValue(mockActiveSession);

      await expect(timeTrackingService.startTracking(1)).rejects.toThrow(
        'Time tracking is already active for this task'
      );
    });
  });

  describe('pauseTracking', () => {
    it('should pause time tracking successfully', async () => {
      const mockSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockPausedSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'paused',
        durationSeconds: 3600,
        pausedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getById.mockResolvedValue(mockSession);
      mockTimeSessionRepository.update.mockResolvedValue(mockPausedSession);

      const result = await timeTrackingService.pauseTracking(1);

      expect(mockTimeSessionRepository.getById).toHaveBeenCalledWith(1);
      expect(mockTimeSessionRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockPausedSession.toJSON());
    });

    it('should throw error if session not found', async () => {
      mockTimeSessionRepository.getById.mockResolvedValue(null);

      await expect(timeTrackingService.pauseTracking(999)).rejects.toThrow(
        'Time session with ID 999 not found'
      );
    });
  });

  describe('resumeTracking', () => {
    it('should resume time tracking successfully', async () => {
      const mockSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'paused',
        durationSeconds: 3600,
        pausedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockResumedSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 3600,
        pausedAt: new Date(),
        resumedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getById.mockResolvedValue(mockSession);
      mockTimeSessionRepository.update.mockResolvedValue(mockResumedSession);

      const result = await timeTrackingService.resumeTracking(1);

      expect(mockTimeSessionRepository.getById).toHaveBeenCalledWith(1);
      expect(mockTimeSessionRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockResumedSession.toJSON());
    });

    it('should throw error if session not found', async () => {
      mockTimeSessionRepository.getById.mockResolvedValue(null);

      await expect(timeTrackingService.resumeTracking(999)).rejects.toThrow(
        'Time session with ID 999 not found'
      );
    });
  });

  describe('stopTracking', () => {
    it('should stop time tracking successfully', async () => {
      const mockSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockStoppedSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'stopped',
        durationSeconds: 7200,
        endedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getById.mockResolvedValue(mockSession);
      mockTimeSessionRepository.update.mockResolvedValue(mockStoppedSession);

      const result = await timeTrackingService.stopTracking(1);

      expect(mockTimeSessionRepository.getById).toHaveBeenCalledWith(1);
      expect(mockTimeSessionRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockStoppedSession.toJSON());
    });

    it('should throw error if session not found', async () => {
      mockTimeSessionRepository.getById.mockResolvedValue(null);

      await expect(timeTrackingService.stopTracking(999)).rejects.toThrow(
        'Time session with ID 999 not found'
      );
    });
  });

  describe('getActiveSession', () => {
    it('should return active session', async () => {
      const mockSession = new TimeSessionModel({
        id: 1,
        taskId: 1,
        startedAt: new Date(),
        status: 'active',
        durationSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTimeSessionRepository.getActiveSession.mockResolvedValue(mockSession);

      const result = await timeTrackingService.getActiveSession();

      expect(mockTimeSessionRepository.getActiveSession).toHaveBeenCalledWith();
      expect(result).toEqual(mockSession);
    });

    it('should return null if no active session', async () => {
      mockTimeSessionRepository.getActiveSession.mockResolvedValue(null);

      const result = await timeTrackingService.getActiveSession();

      expect(mockTimeSessionRepository.getActiveSession).toHaveBeenCalledWith();
      expect(result).toBeNull();
    });
  });

  describe('getSessionsByTask', () => {
    it('should return sessions for a task', async () => {
      const mockSessions = [
        new TimeSessionModel({
          id: 1,
          taskId: 1,
          startedAt: new Date(),
          status: 'stopped',
          durationSeconds: 3600,
          endedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new TimeSessionModel({
          id: 2,
          taskId: 1,
          startedAt: new Date(),
          status: 'stopped',
          durationSeconds: 1800,
          endedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockTimeSessionRepository.getByTask.mockResolvedValue(mockSessions);

      const result = await timeTrackingService.getSessionsByTask(1);

      expect(mockTimeSessionRepository.getByTask).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockSessions[0].toJSON());
      expect(result[1]).toEqual(mockSessions[1].toJSON());
    });
  });

  describe('getTotalTimeForTask', () => {
    it('should return total time for a task', async () => {
      const mockSessions = [
        new TimeSessionModel({
          id: 1,
          taskId: 1,
          startedAt: new Date(),
          status: 'stopped',
          durationSeconds: 3600,
          endedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new TimeSessionModel({
          id: 2,
          taskId: 1,
          startedAt: new Date(),
          status: 'stopped',
          durationSeconds: 1800,
          endedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockTimeSessionRepository.getByTask.mockResolvedValue(mockSessions);

      const result = await timeTrackingService.getTotalTimeForTask(1);

      expect(mockTimeSessionRepository.getByTask).toHaveBeenCalledWith(1);
      expect(result).toBe(5400); // 3600 + 1800 seconds
    });
  });
});