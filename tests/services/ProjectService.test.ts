import { ProjectService } from '../../src/services/ProjectService';
import { ProjectRepository } from '../../src/repositories/ProjectRepository';
import { ProjectModel } from '../../src/models/Project';
import { DatabaseConnection } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');
jest.mock('../../src/repositories/ProjectRepository');

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockRepository: jest.Mocked<ProjectRepository>;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = new DatabaseConnection() as jest.Mocked<DatabaseConnection>;
    mockRepository = new ProjectRepository(mockDb) as jest.Mocked<ProjectRepository>;
    projectService = new ProjectService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
      };

      const mockProject = new ProjectModel({
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject('Test Project', 'A test project');

      expect(mockRepository.create).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject.toJSON());
    });

    it('should create a project without description', async () => {
      const projectData = {
        name: 'Test Project',
        description: undefined,
      };

      const mockProject = new ProjectModel({
        id: 1,
        name: 'Test Project',
        description: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject('Test Project');

      expect(mockRepository.create).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject.toJSON());
    });
  });

  describe('getProject', () => {
    it('should return a project by ID', async () => {
      const mockProject = new ProjectModel({
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.getById.mockResolvedValue(mockProject);

      const result = await projectService.getProject(1);

      expect(mockRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject.toJSON());
    });

    it('should return null if project not found', async () => {
      mockRepository.getById.mockResolvedValue(null);

      const result = await projectService.getProject(999);

      expect(mockRepository.getById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('getProjectByName', () => {
    it('should return a project by name', async () => {
      const mockProject = new ProjectModel({
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.getByName.mockResolvedValue(mockProject);

      const result = await projectService.getProjectByName('Test Project');

      expect(mockRepository.getByName).toHaveBeenCalledWith('Test Project');
      expect(result).toEqual(mockProject.toJSON());
    });

    it('should return null if project not found by name', async () => {
      mockRepository.getByName.mockResolvedValue(null);

      const result = await projectService.getProjectByName('Non-existent Project');

      expect(mockRepository.getByName).toHaveBeenCalledWith('Non-existent Project');
      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should return a list of projects', async () => {
      const mockProjects = [
        new ProjectModel({
          id: 1,
          name: 'Project 1',
          description: 'First project',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new ProjectModel({
          id: 2,
          name: 'Project 2',
          description: 'Second project',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockRepository.list.mockResolvedValue(mockProjects);

      const result = await projectService.listProjects();

      expect(mockRepository.list).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockProjects[0].toJSON());
      expect(result[1]).toEqual(mockProjects[1].toJSON());
    });

    it('should return filtered projects', async () => {
      const filters = { name: 'Test' };
      const mockProjects = [
        new ProjectModel({
          id: 1,
          name: 'Test Project',
          description: 'A test project',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockRepository.list.mockResolvedValue(mockProjects);

      const result = await projectService.listProjects(filters);

      expect(mockRepository.list).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      const updates = {
        name: 'Updated Project',
        description: 'Updated description',
      };

      const mockProject = new ProjectModel({
        id: 1,
        name: 'Updated Project',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.update.mockResolvedValue(mockProject);

      const result = await projectService.updateProject(1, updates);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(mockProject.toJSON());
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await projectService.deleteProject(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('projectExists', () => {
    it('should return true if project exists', async () => {
      mockRepository.exists.mockResolvedValue(true);

      const result = await projectService.projectExists(1);

      expect(mockRepository.exists).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false if project does not exist', async () => {
      mockRepository.exists.mockResolvedValue(false);

      const result = await projectService.projectExists(999);

      expect(mockRepository.exists).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });

  describe('projectNameExists', () => {
    it('should return true if project name exists', async () => {
      mockRepository.existsByName.mockResolvedValue(true);

      const result = await projectService.projectNameExists('Test Project');

      expect(mockRepository.existsByName).toHaveBeenCalledWith('Test Project', undefined);
      expect(result).toBe(true);
    });

    it('should return false if project name does not exist', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      const result = await projectService.projectNameExists('Non-existent Project');

      expect(mockRepository.existsByName).toHaveBeenCalledWith('Non-existent Project', undefined);
      expect(result).toBe(false);
    });
  });

  describe('validateProjectName', () => {
    it('should validate a valid project name', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      const result = await projectService.validateProjectName('Valid Project Name');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty project name', async () => {
      const result = await projectService.validateProjectName('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project name is required');
    });

    it('should reject project name that is too long', async () => {
      const longName = 'a'.repeat(256);
      const result = await projectService.validateProjectName(longName);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project name must be 255 characters or less');
    });

    it('should reject project name with invalid characters', async () => {
      const result = await projectService.validateProjectName('Invalid@Project#Name');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
    });

    it('should reject reserved project names', async () => {
      const result = await projectService.validateProjectName('default');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project name is reserved and cannot be used');
    });

    it('should reject duplicate project names', async () => {
      mockRepository.existsByName.mockResolvedValue(true);

      const result = await projectService.validateProjectName('Existing Project');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project name already exists');
    });
  });
});
