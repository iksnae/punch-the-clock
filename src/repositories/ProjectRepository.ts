import { DatabaseService } from '../database/types';
import { Project, CreateProjectData, UpdateProjectData, ProjectFilters } from '../types/Project';
import { ProjectModel } from '../models/Project';

export class ProjectRepository {
  constructor(private db: DatabaseService) {}

  public async create(data: CreateProjectData): Promise<ProjectModel> {
    const project = ProjectModel.create(data);
    const validation = project.validate();
    
    if (!validation.valid) {
      throw new Error(`Invalid project data: ${validation.errors.join(', ')}`);
    }

    const row = project.toDatabaseRow();
    const result = await this.db.executeQuery(
      'INSERT INTO projects (name, description) VALUES (?, ?)',
      [row.name, row.description]
    );

    const insertId = (result as any).insertId;
    const createdProject = await this.getById(insertId);
    
    if (!createdProject) {
      throw new Error('Failed to create project');
    }

    return createdProject;
  }

  public async getById(id: number): Promise<ProjectModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return ProjectModel.fromDatabaseRow(rows[0]);
  }

  public async getByName(name: string): Promise<ProjectModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM projects WHERE name = ?',
      [name]
    );

    if (rows.length === 0) {
      return null;
    }

    return ProjectModel.fromDatabaseRow(rows[0]);
  }

  public async list(filters?: ProjectFilters): Promise<ProjectModel[]> {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params: any[] = [];

    if (filters?.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }

    if (filters?.createdFrom) {
      sql += ' AND created_at >= ?';
      params.push(filters.createdFrom);
    }

    if (filters?.createdTo) {
      sql += ' AND created_at <= ?';
      params.push(filters.createdTo);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await this.db.executeQuery(sql, params);
    return rows.map((row: any) => ProjectModel.fromDatabaseRow(row));
  }

  public async update(id: number, updates: UpdateProjectData): Promise<ProjectModel> {
    const existingProject = await this.getById(id);
    if (!existingProject) {
      throw new Error(`Project with ID ${id} not found`);
    }

    existingProject.update(updates);
    const validation = existingProject.validate();
    
    if (!validation.valid) {
      throw new Error(`Invalid project data: ${validation.errors.join(', ')}`);
    }

    const row = existingProject.toDatabaseRow();
    await this.db.executeQuery(
      'UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?',
      [row.name, row.description, row.updated_at, id]
    );

    const updatedProject = await this.getById(id);
    if (!updatedProject) {
      throw new Error('Failed to update project');
    }

    return updatedProject;
  }

  public async delete(id: number): Promise<void> {
    const existingProject = await this.getById(id);
    if (!existingProject) {
      throw new Error(`Project with ID ${id} not found`);
    }

    await this.db.executeQuery(
      'DELETE FROM projects WHERE id = ?',
      [id]
    );
  }

  public async exists(id: number): Promise<boolean> {
    const rows = await this.db.executeQuery(
      'SELECT 1 FROM projects WHERE id = ?',
      [id]
    );
    return rows.length > 0;
  }

  public async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM projects WHERE name = ?';
    const params: any[] = [name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const rows = await this.db.executeQuery(sql, params);
    return rows.length > 0;
  }

  public async getStats(id: number): Promise<{
    totalTasks: number;
    completedTasks: number;
    totalTimeSpent: number;
    averageTaskTime: number;
    lastActivity?: Date;
  }> {
    const taskStats = await this.db.executeQuery(
      `SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        MAX(updated_at) as lastActivity
       FROM tasks 
       WHERE project_id = ?`,
      [id]
    );

    const timeStats = await this.db.executeQuery(
      `SELECT 
        COALESCE(SUM(duration_seconds), 0) as totalTimeSpent,
        COALESCE(AVG(duration_seconds), 0) as averageTaskTime
       FROM time_sessions ts
       JOIN tasks t ON ts.task_id = t.id
       WHERE t.project_id = ?`,
      [id]
    );

    const taskResult = taskStats[0] as any;
    const timeResult = timeStats[0] as any;

    return {
      totalTasks: taskResult.totalTasks || 0,
      completedTasks: taskResult.completedTasks || 0,
      totalTimeSpent: timeResult.totalTimeSpent || 0,
      averageTaskTime: timeResult.averageTaskTime || 0,
      lastActivity: taskResult.lastActivity ? new Date(taskResult.lastActivity) : undefined,
    };
  }
}
