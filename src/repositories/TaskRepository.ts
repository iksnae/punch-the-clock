import { DatabaseService } from '../database/types';
import { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '../types/Task';
import { TaskModel } from '../models/Task';

export class TaskRepository {
  constructor(private db: DatabaseService) {}

  public async create(data: CreateTaskData): Promise<TaskModel> {
    const task = TaskModel.create(data);
    const validation = task.validate();
    
    if (!validation.valid) {
      throw new Error(`Invalid task data: ${validation.errors.join(', ')}`);
    }

    const row = task.toDatabaseRow();
    const result = await this.db.executeQuery(
      `INSERT INTO tasks (project_id, number, title, description, state, size_estimate, time_estimate_hours) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [row.project_id, row.number, row.title, row.description, row.state, row.size_estimate, row.time_estimate_hours]
    );

    const insertId = (result as any).insertId;
    const createdTask = await this.getById(insertId);
    
    if (!createdTask) {
      throw new Error('Failed to create task');
    }

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      await this.addTags(insertId, data.tags);
    }

    return createdTask;
  }

  public async getById(id: number): Promise<TaskModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const task = TaskModel.fromDatabaseRow(rows[0]);
    const tags = await this.getTags(id);
    task.update({ tags });

    return task;
  }

  public async getByNumber(projectId: number, number: string): Promise<TaskModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM tasks WHERE project_id = ? AND number = ?',
      [projectId, number]
    );

    if (rows.length === 0) {
      return null;
    }

    const task = TaskModel.fromDatabaseRow(rows[0]);
    const tags = await this.getTags(task.getId());
    task.update({ tags });

    return task;
  }

  public async list(filters?: TaskFilters): Promise<TaskModel[]> {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filters?.projectId) {
      sql += ' AND project_id = ?';
      params.push(filters.projectId);
    }

    if (filters?.state) {
      sql += ' AND state = ?';
      params.push(filters.state);
    }

    if (filters?.createdFrom) {
      sql += ' AND created_at >= ?';
      params.push(filters.createdFrom);
    }

    if (filters?.createdTo) {
      sql += ' AND created_at <= ?';
      params.push(filters.createdTo);
    }

    if (filters?.search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await this.db.executeQuery(sql, params);
    const tasks: TaskModel[] = [];

    for (const row of rows) {
      const task = TaskModel.fromDatabaseRow(row);
      const tags = await this.getTags(task.getId());
      task.update({ tags });
      tasks.push(task);
    }

    // Filter by tags if specified
    if (filters?.tags && filters.tags.length > 0) {
      return tasks.filter(task => 
        filters.tags!.some(tag => task.hasTag(tag))
      );
    }

    return tasks;
  }

  public async update(id: number, updates: UpdateTaskData): Promise<TaskModel> {
    const existingTask = await this.getById(id);
    if (!existingTask) {
      throw new Error(`Task with ID ${id} not found`);
    }

    existingTask.update(updates);
    const validation = existingTask.validate();
    
    if (!validation.valid) {
      throw new Error(`Invalid task data: ${validation.errors.join(', ')}`);
    }

    const row = existingTask.toDatabaseRow();
    await this.db.executeQuery(
      `UPDATE tasks SET 
       number = ?, title = ?, description = ?, state = ?, 
       size_estimate = ?, time_estimate_hours = ?, updated_at = ? 
       WHERE id = ?`,
      [row.number, row.title, row.description, row.state, 
       row.size_estimate, row.time_estimate_hours, row.updated_at, id]
    );

    // Update tags if provided
    if (updates.tags !== undefined) {
      await this.clearTags(id);
      if (updates.tags.length > 0) {
        await this.addTags(id, updates.tags);
      }
    }

    const updatedTask = await this.getById(id);
    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    return updatedTask;
  }

  public async delete(id: number): Promise<void> {
    const existingTask = await this.getById(id);
    if (!existingTask) {
      throw new Error(`Task with ID ${id} not found`);
    }

    await this.db.executeQuery(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
  }

  public async exists(id: number): Promise<boolean> {
    const rows = await this.db.executeQuery(
      'SELECT 1 FROM tasks WHERE id = ?',
      [id]
    );
    return rows.length > 0;
  }

  public async existsByNumber(projectId: number, number: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM tasks WHERE project_id = ? AND number = ?';
    const params: any[] = [projectId, number];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const rows = await this.db.executeQuery(sql, params);
    return rows.length > 0;
  }

  public async getTags(taskId: number): Promise<string[]> {
    const rows = await this.db.executeQuery(
      'SELECT tag FROM task_tags WHERE task_id = ? ORDER BY tag',
      [taskId]
    );
    return rows.map((row: any) => row.tag);
  }

  public async addTags(taskId: number, tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.db.executeQuery(
        'INSERT IGNORE INTO task_tags (task_id, tag) VALUES (?, ?)',
        [taskId, tag]
      );
    }
  }

  public async removeTag(taskId: number, tag: string): Promise<void> {
    await this.db.executeQuery(
      'DELETE FROM task_tags WHERE task_id = ? AND tag = ?',
      [taskId, tag]
    );
  }

  public async clearTags(taskId: number): Promise<void> {
    await this.db.executeQuery(
      'DELETE FROM task_tags WHERE task_id = ?',
      [taskId]
    );
  }

  public async getStats(id: number): Promise<{
    totalTimeSpent: number;
    sessionCount: number;
    averageSessionTime: number;
    lastActivity?: Date;
  }> {
    const timeStats = await this.db.executeQuery(
      `SELECT 
        COALESCE(SUM(duration_seconds), 0) as totalTimeSpent,
        COUNT(*) as sessionCount,
        COALESCE(AVG(duration_seconds), 0) as averageSessionTime,
        MAX(updated_at) as lastActivity
       FROM time_sessions 
       WHERE task_id = ?`,
      [id]
    );

    const result = timeStats[0] as any;
    return {
      totalTimeSpent: result.totalTimeSpent || 0,
      sessionCount: result.sessionCount || 0,
      averageSessionTime: result.averageSessionTime || 0,
      lastActivity: result.lastActivity ? new Date(result.lastActivity) : undefined,
    };
  }
}
