import { DatabaseService } from '../database/types';
import { TimeSession, CreateTimeSessionData, UpdateTimeSessionData, TimeSessionFilters } from '../types/TimeSession';
import { TimeSessionModel } from '../models/TimeSession';

export class TimeSessionRepository {
  constructor(private db: DatabaseService) {}

  public async create(data: CreateTimeSessionData): Promise<TimeSessionModel> {
    const timeSession = TimeSessionModel.create(data);
    const validation = timeSession.validate();
    
    if (!validation.valid) {
      throw new Error(`Invalid time session data: ${validation.errors.join(', ')}`);
    }

    const row = timeSession.toDatabaseRow();
    const result = await this.db.executeQuery(
      `INSERT INTO time_sessions (task_id, started_at, paused_at, resumed_at, stopped_at, duration_seconds) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.task_id, row.started_at, row.paused_at, row.resumed_at, row.stopped_at, row.duration_seconds]
    );

    const insertId = (result as any).insertId;
    const createdSession = await this.getById(insertId);
    
    if (!createdSession) {
      throw new Error('Failed to create time session');
    }

    return createdSession;
  }

  public async getById(id: number): Promise<TimeSessionModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM time_sessions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return TimeSessionModel.fromDatabaseRow(rows[0]);
  }

  public async list(filters?: TimeSessionFilters): Promise<TimeSessionModel[]> {
    let sql = 'SELECT * FROM time_sessions WHERE 1=1';
    const params: any[] = [];

    if (filters?.taskId) {
      sql += ' AND task_id = ?';
      params.push(filters.taskId);
    }

    if (filters?.startedFrom) {
      sql += ' AND started_at >= ?';
      params.push(filters.startedFrom);
    }

    if (filters?.startedTo) {
      sql += ' AND started_at <= ?';
      params.push(filters.startedTo);
    }

    if (filters?.state) {
      switch (filters.state) {
        case 'active':
          sql += ' AND stopped_at IS NULL AND (paused_at IS NULL OR resumed_at IS NOT NULL)';
          break;
        case 'paused':
          sql += ' AND stopped_at IS NULL AND paused_at IS NOT NULL AND resumed_at IS NULL';
          break;
        case 'stopped':
          sql += ' AND stopped_at IS NOT NULL';
          break;
      }
    }

    sql += ' ORDER BY started_at DESC';

    const rows = await this.db.executeQuery(sql, params);
    return rows.map((row: any) => TimeSessionModel.fromDatabaseRow(row));
  }

  public async update(id: number, updates: UpdateTimeSessionData): Promise<TimeSessionModel> {
    const existingSession = await this.getById(id);
    if (!existingSession) {
      throw new Error(`Time session with ID ${id} not found`);
    }

    existingSession.update(updates);
    const validation = existingSession.validate();
    
    if (!validation.valid) {
      throw new Error(`Invalid time session data: ${validation.errors.join(', ')}`);
    }

    const row = existingSession.toDatabaseRow();
    await this.db.executeQuery(
      `UPDATE time_sessions SET 
       paused_at = ?, resumed_at = ?, stopped_at = ?, duration_seconds = ?, updated_at = ? 
       WHERE id = ?`,
      [row.paused_at, row.resumed_at, row.stopped_at, row.duration_seconds, row.updated_at, id]
    );

    const updatedSession = await this.getById(id);
    if (!updatedSession) {
      throw new Error('Failed to update time session');
    }

    return updatedSession;
  }

  public async delete(id: number): Promise<void> {
    const existingSession = await this.getById(id);
    if (!existingSession) {
      throw new Error(`Time session with ID ${id} not found`);
    }

    await this.db.executeQuery(
      'DELETE FROM time_sessions WHERE id = ?',
      [id]
    );
  }

  public async exists(id: number): Promise<boolean> {
    const rows = await this.db.executeQuery(
      'SELECT 1 FROM time_sessions WHERE id = ?',
      [id]
    );
    return rows.length > 0;
  }

  public async getActiveSession(): Promise<TimeSessionModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM time_sessions WHERE stopped_at IS NULL AND (paused_at IS NULL OR resumed_at IS NOT NULL) ORDER BY started_at DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return null;
    }

    return TimeSessionModel.fromDatabaseRow(rows[0]);
  }

  public async getActiveSessionForTask(taskId: number): Promise<TimeSessionModel | null> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM time_sessions WHERE task_id = ? AND stopped_at IS NULL AND (paused_at IS NULL OR resumed_at IS NOT NULL) ORDER BY started_at DESC LIMIT 1',
      [taskId]
    );

    if (rows.length === 0) {
      return null;
    }

    return TimeSessionModel.fromDatabaseRow(rows[0]);
  }

  public async getPausedSessions(): Promise<TimeSessionModel[]> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM time_sessions WHERE stopped_at IS NULL AND paused_at IS NOT NULL AND resumed_at IS NULL ORDER BY paused_at DESC'
    );

    return rows.map((row: any) => TimeSessionModel.fromDatabaseRow(row));
  }

  public async getSessionsByTask(taskId: number): Promise<TimeSessionModel[]> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM time_sessions WHERE task_id = ? ORDER BY started_at DESC',
      [taskId]
    );

    return rows.map((row: any) => TimeSessionModel.fromDatabaseRow(row));
  }

  public async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<TimeSessionModel[]> {
    const rows = await this.db.executeQuery(
      'SELECT * FROM time_sessions WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC',
      [startDate, endDate]
    );

    return rows.map((row: any) => TimeSessionModel.fromDatabaseRow(row));
  }

  public async getStats(filters?: TimeSessionFilters): Promise<{
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    longestSession: number;
    shortestSession: number;
    activeSessions: number;
    pausedSessions: number;
    completedSessions: number;
  }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters?.taskId) {
      whereClause += ' AND task_id = ?';
      params.push(filters.taskId);
    }

    if (filters?.startedFrom) {
      whereClause += ' AND started_at >= ?';
      params.push(filters.startedFrom);
    }

    if (filters?.startedTo) {
      whereClause += ' AND started_at <= ?';
      params.push(filters.startedTo);
    }

    const stats = await this.db.executeQuery(
      `SELECT 
        COUNT(*) as totalSessions,
        COALESCE(SUM(duration_seconds), 0) as totalDuration,
        COALESCE(AVG(duration_seconds), 0) as averageDuration,
        COALESCE(MAX(duration_seconds), 0) as longestSession,
        COALESCE(MIN(duration_seconds), 0) as shortestSession,
        SUM(CASE WHEN stopped_at IS NULL AND (paused_at IS NULL OR resumed_at IS NOT NULL) THEN 1 ELSE 0 END) as activeSessions,
        SUM(CASE WHEN stopped_at IS NULL AND paused_at IS NOT NULL AND resumed_at IS NULL THEN 1 ELSE 0 END) as pausedSessions,
        SUM(CASE WHEN stopped_at IS NOT NULL THEN 1 ELSE 0 END) as completedSessions
       FROM time_sessions ${whereClause}`,
      params
    );

    const result = stats[0] as any;
    return {
      totalSessions: result.totalSessions || 0,
      totalDuration: result.totalDuration || 0,
      averageDuration: result.averageDuration || 0,
      longestSession: result.longestSession || 0,
      shortestSession: result.shortestSession || 0,
      activeSessions: result.activeSessions || 0,
      pausedSessions: result.pausedSessions || 0,
      completedSessions: result.completedSessions || 0,
    };
  }
}
