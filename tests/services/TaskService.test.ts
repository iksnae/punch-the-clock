import { TaskService } from '../../src/services/TaskService';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { TaskTagRepository } from '../../src/repositories/TaskTagRepository';
import { TaskModel } from '../../src/models/Task';
import { DatabaseConnection } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');
jest.mock('../../src/repositories/TaskRepository');
jest.mock('../../src/repositories/TaskTagRepository');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockTaskTagRepository: jest.Mocked<TaskTagRepository>;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = new DatabaseConnection() as jest.Mocked<DatabaseConnection>;
    mockTaskRepository = new TaskRepository(mockDb) as jest.Mocked<TaskRepository>;
    mockTaskTagRepository = new TaskTagRepository(mockDb) as jest.Mocked<TaskTagRepository>;
    taskService = new TaskService(mockTaskRepository, mockTaskTagRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        description: 'A test task',
        state: 'pending' as const,
        sizeEstimate: 2,
        timeEstimateHours: 2,
        tags: ['test', 'feature'],
      };

      const mockTask = new TaskModel({
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        description: 'A test task',
        state: 'pending',
        sizeEstimate: 2,
        timeEstimateHours: 2,
        tags: ['test', 'feature'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTaskRepository.create.mockResolvedValue(mockTask);

      const result = await taskService.createTask(1, taskData);

      expect(mockTaskRepository.create).toHaveBeenCalledWith({ ...taskData, projectId: 1 });
      expect(result).toEqual(mockTask.toJSON());
    });

    it('should create a task with minimal data', async () => {
      const taskData = {
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        state: 'pending' as const,
      };

      const mockTask = new TaskModel({
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        state: 'pending',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTaskRepository.create.mockResolvedValue(mockTask);

      const result = await taskService.createTask(1, taskData);

      expect(mockTaskRepository.create).toHaveBeenCalledWith({ ...taskData, projectId: 1 });
      expect(result).toEqual(mockTask.toJSON());
    });
  });

  describe('getTask', () => {
    it('should return a task by ID', async () => {
      const mockTask = new TaskModel({
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        state: 'pending',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTaskRepository.getById.mockResolvedValue(mockTask);

      const result = await taskService.getTask(1);

      expect(mockTaskRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTask.toJSON());
    });

    it('should return null if task not found', async () => {
      mockTaskRepository.getById.mockResolvedValue(null);

      const result = await taskService.getTask(999);

      expect(mockTaskRepository.getById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('getTaskByNumber', () => {
    it('should return a task by number', async () => {
      const mockTask = new TaskModel({
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Test Task',
        state: 'pending',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTaskRepository.getByNumber.mockResolvedValue(mockTask);

      const result = await taskService.getTaskByNumber(1, 'TASK-1');

      expect(mockTaskRepository.getByNumber).toHaveBeenCalledWith(1, 'TASK-1');
      expect(result).toEqual(mockTask.toJSON());
    });

    it('should return null if task not found by number', async () => {
      mockTaskRepository.getByNumber.mockResolvedValue(null);

      const result = await taskService.getTaskByNumber(1, 'NON-EXISTENT');

      expect(mockTaskRepository.getByNumber).toHaveBeenCalledWith(1, 'NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should return a list of tasks', async () => {
      const mockTasks = [
        new TaskModel({
          id: 1,
          projectId: 1,
          number: 'TASK-1',
          title: 'Task 1',
          state: 'pending',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new TaskModel({
          id: 2,
          projectId: 1,
          number: 'TASK-2',
          title: 'Task 2',
          state: 'completed',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockTaskRepository.list.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks(1);

      expect(mockTaskRepository.list).toHaveBeenCalledWith({ projectId: 1 });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockTasks[0].toJSON());
      expect(result[1]).toEqual(mockTasks[1].toJSON());
    });

    it('should return filtered tasks', async () => {
      const filters = { state: 'pending' as const };
      const mockTasks = [
        new TaskModel({
          id: 1,
          projectId: 1,
          number: 'TASK-1',
          title: 'Task 1',
          state: 'pending',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockTaskRepository.list.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks(1, filters);

      expect(mockTaskRepository.list).toHaveBeenCalledWith({ ...filters, projectId: 1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const updates = {
        title: 'Updated Task',
        state: 'in-progress' as const,
      };

      const mockTask = new TaskModel({
        id: 1,
        projectId: 1,
        number: 'TASK-1',
        title: 'Updated Task',
        state: 'in-progress',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTaskRepository.update.mockResolvedValue(mockTask);

      const result = await taskService.updateTask(1, updates);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(mockTask.toJSON());
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      mockTaskRepository.delete.mockResolvedValue(undefined);

      await taskService.deleteTask(1);

      expect(mockTaskRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('taskExists', () => {
    it('should return true if task exists', async () => {
      mockTaskRepository.exists.mockResolvedValue(true);

      const result = await taskService.taskExists(1);

      expect(mockTaskRepository.exists).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false if task does not exist', async () => {
      mockTaskRepository.exists.mockResolvedValue(false);

      const result = await taskService.taskExists(999);

      expect(mockTaskRepository.exists).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });

  describe('taskNumberExists', () => {
    it('should return true if task number exists', async () => {
      mockTaskRepository.existsByNumber.mockResolvedValue(true);

      const result = await taskService.taskNumberExists(1, 'TASK-1');

      expect(mockTaskRepository.existsByNumber).toHaveBeenCalledWith(1, 'TASK-1', undefined);
      expect(result).toBe(true);
    });

    it('should return false if task number does not exist', async () => {
      mockTaskRepository.existsByNumber.mockResolvedValue(false);

      const result = await taskService.taskNumberExists(1, 'NON-EXISTENT');

      expect(mockTaskRepository.existsByNumber).toHaveBeenCalledWith(1, 'NON-EXISTENT', undefined);
      expect(result).toBe(false);
    });
  });

  describe('validateTaskNumber', () => {
    it('should validate a valid task number', async () => {
      mockTaskRepository.existsByNumber.mockResolvedValue(false);

      const result = await taskService.validateTaskNumber(1, 'TASK-1');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty task number', async () => {
      const result = await taskService.validateTaskNumber(1, '');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task number is required');
    });

    it('should reject task number that is too long', async () => {
      const longNumber = 'a'.repeat(51);
      const result = await taskService.validateTaskNumber(1, longNumber);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task number must be 50 characters or less');
    });

    it('should reject task number with invalid characters', async () => {
      const result = await taskService.validateTaskNumber(1, 'TASK@1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task number can only contain letters, numbers, hyphens, and underscores');
    });

    it('should reject duplicate task numbers', async () => {
      mockTaskRepository.existsByNumber.mockResolvedValue(true);

      const result = await taskService.validateTaskNumber(1, 'TASK-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task number already exists in this project');
    });
  });

  describe('generateTaskNumber', () => {
    it('should generate a unique task number', async () => {
      mockTaskRepository.existsByNumber
        .mockResolvedValueOnce(true)  // TASK-1 exists
        .mockResolvedValueOnce(true)  // TASK-2 exists
        .mockResolvedValueOnce(false); // TASK-3 does not exist

      const result = await taskService.generateTaskNumber(1, 'TASK');

      expect(result).toBe('TASK-3');
      expect(mockTaskRepository.existsByNumber).toHaveBeenCalledTimes(3);
    });

    it('should generate task number with default prefix', async () => {
      mockTaskRepository.existsByNumber.mockResolvedValue(false);

      const result = await taskService.generateTaskNumber(1);

      expect(result).toBe('TASK-1');
      expect(mockTaskRepository.existsByNumber).toHaveBeenCalledWith(1, 'TASK-1', undefined);
    });
  });
});