import { ProjectRepository } from '../repositories/ProjectRepository';
import { Project, CreateProjectData, UpdateProjectData, ProjectFilters, ProjectStats } from '../types/Project';
import { ProjectModel } from '../models/Project';
import { performanceMonitor } from '../utils/performance';

export class ProjectService {
  private repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  public async createProject(name: string, description?: string): Promise<Project> {
    return await performanceMonitor.measureAsync('ProjectService.createProject', async () => {
      const data: CreateProjectData = { name, description };
      const project = await this.repository.create(data);
      return project.toJSON();
    });
  }

  public async getProject(id: number): Promise<Project | null> {
    const project = await this.repository.getById(id);
    return project ? project.toJSON() : null;
  }

  public async getProjectByName(name: string): Promise<Project | null> {
    const project = await this.repository.getByName(name);
    return project ? project.toJSON() : null;
  }

  public async listProjects(filters?: ProjectFilters): Promise<Project[]> {
    return await performanceMonitor.measureAsync('ProjectService.listProjects', async () => {
      const projects = await this.repository.list(filters);
      return projects.map(project => project.toJSON());
    });
  }

  public async updateProject(id: number, updates: UpdateProjectData): Promise<Project> {
    const project = await this.repository.update(id, updates);
    return project.toJSON();
  }

  public async deleteProject(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  public async projectExists(id: number): Promise<boolean> {
    return await this.repository.exists(id);
  }

  public async projectNameExists(name: string, excludeId?: number): Promise<boolean> {
    return await this.repository.existsByName(name, excludeId);
  }

  public async getProjectStats(id: number): Promise<ProjectStats> {
    const stats = await this.repository.getStats(id);
    const project = await this.repository.getById(id);
    
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    return {
      id: project.getId(),
      name: project.getName(),
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      totalTimeSpent: stats.totalTimeSpent,
      averageTaskTime: stats.averageTaskTime,
      lastActivity: stats.lastActivity,
    };
  }

  public async searchProjects(query: string): Promise<Project[]> {
    const filters: ProjectFilters = {
      name: query,
    };
    return await this.listProjects(filters);
  }

  public async getRecentProjects(limit: number = 10): Promise<Project[]> {
    const filters: ProjectFilters = {
      createdFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    };
    const projects = await this.listProjects(filters);
    return projects.slice(0, limit);
  }

  public async getActiveProjects(): Promise<Project[]> {
    // Get projects that have tasks in progress or have been active recently
    const projects = await this.listProjects();
    const activeProjects: Project[] = [];

    for (const project of projects) {
      const stats = await this.getProjectStats(project.id);
      if (stats.lastActivity && stats.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        activeProjects.push(project);
      }
    }

    return activeProjects;
  }

  public async validateProjectName(name: string, excludeId?: number): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (name && name.length > 255) {
      errors.push('Project name must be 255 characters or less');
    }

    if (name && !/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      errors.push('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    const reservedNames = ['default', 'system', 'admin', 'root', 'test'];
    if (name && reservedNames.includes(name.toLowerCase())) {
      errors.push('Project name is reserved and cannot be used');
    }

    const exists = await this.projectNameExists(name, excludeId);
    if (exists) {
      errors.push('Project name already exists');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
