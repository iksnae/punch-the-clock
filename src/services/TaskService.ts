import { TaskRepository } from '../repositories/TaskRepository';
import { TaskTagRepository } from '../repositories/TaskTagRepository';
import { Task, CreateTaskData, UpdateTaskData, TaskFilters, TaskStats } from '../types/Task';
import { TaskModel } from '../models/Task';

export class TaskService {
  private repository: TaskRepository;
  private tagRepository: TaskTagRepository;

  constructor(repository: TaskRepository, tagRepository: TaskTagRepository) {
    this.repository = repository;
    this.tagRepository = tagRepository;
  }

  public async createTask(projectId: number, taskData: CreateTaskData): Promise<Task> {
    const data: CreateTaskData = { ...taskData, projectId };
    const task = await this.repository.create(data);
    return task.toJSON();
  }

  public async getTask(id: number): Promise<Task | null> {
    const task = await this.repository.getById(id);
    return task ? task.toJSON() : null;
  }

  public async getTaskByNumber(projectId: number, number: string): Promise<Task | null> {
    const task = await this.repository.getByNumber(projectId, number);
    return task ? task.toJSON() : null;
  }

  public async listTasks(projectId: number, filters?: TaskFilters): Promise<Task[]> {
    const taskFilters: TaskFilters = { ...filters, projectId };
    const tasks = await this.repository.list(taskFilters);
    return tasks.map(task => task.toJSON());
  }

  public async updateTask(id: number, updates: UpdateTaskData): Promise<Task> {
    const task = await this.repository.update(id, updates);
    return task.toJSON();
  }

  public async deleteTask(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  public async taskExists(id: number): Promise<boolean> {
    return await this.repository.exists(id);
  }

  public async taskNumberExists(projectId: number, number: string, excludeId?: number): Promise<boolean> {
    return await this.repository.existsByNumber(projectId, number, excludeId);
  }

  public async getTaskStats(id: number): Promise<TaskStats> {
    const stats = await this.repository.getStats(id);
    const task = await this.repository.getById(id);
    
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    return {
      id: task.getId(),
      number: task.getNumber(),
      title: task.getTitle(),
      state: task.getState(),
      totalTimeSpent: stats.totalTimeSpent,
      sessionCount: stats.sessionCount,
      averageSessionTime: stats.averageSessionTime,
      lastActivity: stats.lastActivity,
    };
  }

  public async addTag(taskId: number, tag: string): Promise<void> {
    await this.tagRepository.addTag(taskId, tag);
  }

  public async removeTag(taskId: number, tag: string): Promise<void> {
    await this.tagRepository.removeTag(taskId, tag);
  }

  public async setTags(taskId: number, tags: string[]): Promise<void> {
    await this.tagRepository.setTags(taskId, tags);
  }

  public async getTags(taskId: number): Promise<string[]> {
    return await this.tagRepository.getTagsByTask(taskId);
  }

  public async getAllTags(): Promise<string[]> {
    return await this.tagRepository.getAllTags();
  }

  public async getTagsByProject(projectId: number): Promise<string[]> {
    return await this.tagRepository.getTagsByProject(projectId);
  }

  public async searchTags(query: string): Promise<string[]> {
    return await this.tagRepository.searchTags(query);
  }

  public async getTagStats(): Promise<Array<{ tag: string; taskCount: number }>> {
    return await this.tagRepository.getTagStats();
  }

  public async getTagStatsByProject(projectId: number): Promise<Array<{ tag: string; taskCount: number }>> {
    return await this.tagRepository.getTagStatsByProject(projectId);
  }

  public async searchTasks(projectId: number, query: string): Promise<Task[]> {
    const filters: TaskFilters = {
      projectId,
      search: query,
    };
    return await this.listTasks(projectId, filters);
  }

  public async getTasksByState(projectId: number, state: string): Promise<Task[]> {
    const filters: TaskFilters = {
      projectId,
      state: state as any,
    };
    return await this.listTasks(projectId, filters);
  }

  public async getTasksByTag(projectId: number, tag: string): Promise<Task[]> {
    const filters: TaskFilters = {
      projectId,
      tags: [tag],
    };
    return await this.listTasks(projectId, filters);
  }

  public async getRecentTasks(projectId: number, limit: number = 10): Promise<Task[]> {
    const filters: TaskFilters = {
      projectId,
      createdFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    };
    const tasks = await this.listTasks(projectId, filters);
    return tasks.slice(0, limit);
  }

  public async getActiveTasks(projectId: number): Promise<Task[]> {
    return await this.getTasksByState(projectId, 'in-progress');
  }

  public async getCompletedTasks(projectId: number): Promise<Task[]> {
    return await this.getTasksByState(projectId, 'completed');
  }

  public async getPendingTasks(projectId: number): Promise<Task[]> {
    return await this.getTasksByState(projectId, 'pending');
  }

  public async getBlockedTasks(projectId: number): Promise<Task[]> {
    return await this.getTasksByState(projectId, 'blocked');
  }

  public async validateTaskNumber(projectId: number, number: string, excludeId?: number): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!number || number.trim().length === 0) {
      errors.push('Task number is required');
    }

    if (number && number.length > 50) {
      errors.push('Task number must be 50 characters or less');
    }

    if (number && !/^[a-zA-Z0-9\-_]+$/.test(number)) {
      errors.push('Task number can only contain letters, numbers, hyphens, and underscores');
    }

    const exists = await this.taskNumberExists(projectId, number, excludeId);
    if (exists) {
      errors.push('Task number already exists in this project');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public async generateTaskNumber(projectId: number, prefix: string = 'TASK'): Promise<string> {
    let counter = 1;
    let number = `${prefix}-${counter}`;
    
    while (await this.taskNumberExists(projectId, number)) {
      counter++;
      number = `${prefix}-${counter}`;
    }
    
    return number;
  }
}
