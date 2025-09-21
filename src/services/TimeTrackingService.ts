import { TimeSessionRepository } from '../repositories/TimeSessionRepository';
import { TimeSession, CreateTimeSessionData, UpdateTimeSessionData, TimeSessionFilters, TimeSessionStats } from '../types/TimeSession';
import { TimeSessionModel } from '../models/TimeSession';
import { TimeCalculations } from '../utils/timeCalculations';

export class TimeTrackingService {
  private repository: TimeSessionRepository;

  constructor(repository: TimeSessionRepository) {
    this.repository = repository;
  }

  public async startTracking(taskId: number, startTime?: Date): Promise<TimeSession> {
    // Check if there's already an active session
    const activeSession = await this.repository.getActiveSession();
    if (activeSession) {
      throw new Error('Another time session is already active');
    }

    // Check if there's already an active session for this task
    const activeTaskSession = await this.repository.getActiveSessionForTask(taskId);
    if (activeTaskSession) {
      throw new Error('Time tracking is already active for this task');
    }

    const data: CreateTimeSessionData = {
      taskId,
      startedAt: startTime || new Date(),
    };

    const session = await this.repository.create(data);
    return session.toJSON();
  }

  public async pauseTracking(sessionId: number, pauseTime?: Date): Promise<TimeSession> {
    const session = await this.repository.getById(sessionId);
    if (!session) {
      throw new Error(`Time session with ID ${sessionId} not found`);
    }

    if (session.getState() !== 'active') {
      throw new Error(`Cannot pause session in ${session.getState()} state`);
    }

    const pauseTimeToUse = pauseTime || new Date();
    session.pause(pauseTimeToUse);

    const updatedSession = await this.repository.update(sessionId, {
      pausedAt: pauseTimeToUse,
    });

    return updatedSession.toJSON();
  }

  public async resumeTracking(sessionId: number, resumeTime?: Date): Promise<TimeSession> {
    const session = await this.repository.getById(sessionId);
    if (!session) {
      throw new Error(`Time session with ID ${sessionId} not found`);
    }

    if (session.getState() !== 'paused') {
      throw new Error(`Cannot resume session in ${session.getState()} state`);
    }

    const resumeTimeToUse = resumeTime || new Date();
    session.resume(resumeTimeToUse);

    const updatedSession = await this.repository.update(sessionId, {
      resumedAt: resumeTimeToUse,
    });

    return updatedSession.toJSON();
  }

  public async stopTracking(sessionId: number, stopTime?: Date): Promise<TimeSession> {
    const session = await this.repository.getById(sessionId);
    if (!session) {
      throw new Error(`Time session with ID ${sessionId} not found`);
    }

    if (session.getState() === 'stopped') {
      throw new Error('Session is already stopped');
    }

    const stopTimeToUse = stopTime || new Date();
    session.stop(stopTimeToUse);

    const updatedSession = await this.repository.update(sessionId, {
      stoppedAt: stopTimeToUse,
      durationSeconds: session.getDurationSeconds(),
    });

    return updatedSession.toJSON();
  }

  public async getActiveSession(): Promise<TimeSession | null> {
    const session = await this.repository.getActiveSession();
    return session ? session.toJSON() : null;
  }

  public async getActiveSessionForTask(taskId: number): Promise<TimeSession | null> {
    const session = await this.repository.getActiveSessionForTask(taskId);
    return session ? session.toJSON() : null;
  }

  public async getSession(id: number): Promise<TimeSession | null> {
    const session = await this.repository.getById(id);
    return session ? session.toJSON() : null;
  }

  public async listSessions(filters?: TimeSessionFilters): Promise<TimeSession[]> {
    const sessions = await this.repository.list(filters);
    return sessions.map(session => session.toJSON());
  }

  public async getSessionsByTask(taskId: number): Promise<TimeSession[]> {
    const sessions = await this.repository.getSessionsByTask(taskId);
    return sessions.map(session => session.toJSON());
  }

  public async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<TimeSession[]> {
    const sessions = await this.repository.getSessionsByDateRange(startDate, endDate);
    return sessions.map(session => session.toJSON());
  }

  public async getPausedSessions(): Promise<TimeSession[]> {
    const sessions = await this.repository.getPausedSessions();
    return sessions.map(session => session.toJSON());
  }

  public async getStats(filters?: TimeSessionFilters): Promise<TimeSessionStats> {
    return await this.repository.getStats(filters);
  }

  public async pauseAllActiveSessions(): Promise<void> {
    const activeSession = await this.repository.getActiveSession();
    if (activeSession) {
      await this.pauseTracking(activeSession.getId());
    }
  }

  public async stopAllActiveSessions(): Promise<void> {
    const activeSession = await this.repository.getActiveSession();
    if (activeSession) {
      await this.stopTracking(activeSession.getId());
    }
  }

  public async resumeAllPausedSessions(): Promise<void> {
    const pausedSessions = await this.repository.getPausedSessions();
    for (const session of pausedSessions) {
      await this.resumeTracking(session.getId());
    }
  }

  public async getTotalTimeForTask(taskId: number): Promise<number> {
    const sessions = await this.repository.getSessionsByTask(taskId);
    return sessions.reduce((total, session) => total + session.getDurationSeconds(), 0);
  }

  public async getTotalTimeForDateRange(startDate: Date, endDate: Date): Promise<number> {
    const sessions = await this.repository.getSessionsByDateRange(startDate, endDate);
    return sessions.reduce((total, session) => total + session.getDurationSeconds(), 0);
  }

  public async getAverageSessionTime(taskId?: number): Promise<number> {
    const filters: TimeSessionFilters | undefined = taskId ? { taskId } : undefined;
    const stats = await this.repository.getStats(filters);
    return stats.averageDuration;
  }

  public async getLongestSession(taskId?: number): Promise<TimeSession | null> {
    const filters: TimeSessionFilters | undefined = taskId ? { taskId } : undefined;
    const sessions = await this.repository.list(filters);
    
    if (sessions.length === 0) {
      return null;
    }

    const longestSession = sessions.reduce((longest, current) => 
      current.getDurationSeconds() > longest.getDurationSeconds() ? current : longest
    );

    return longestSession.toJSON();
  }

  public async getShortestSession(taskId?: number): Promise<TimeSession | null> {
    const filters: TimeSessionFilters | undefined = taskId ? { taskId } : undefined;
    const sessions = await this.repository.list(filters);
    
    if (sessions.length === 0) {
      return null;
    }

    const shortestSession = sessions.reduce((shortest, current) => 
      current.getDurationSeconds() < shortest.getDurationSeconds() ? current : shortest
    );

    return shortestSession.toJSON();
  }

  public async getSessionsByDay(date: Date): Promise<TimeSession[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.getSessionsByDateRange(startOfDay, endOfDay);
  }

  public async getSessionsByWeek(date: Date): Promise<TimeSession[]> {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return await this.getSessionsByDateRange(startOfWeek, endOfWeek);
  }

  public async getSessionsByMonth(date: Date): Promise<TimeSession[]> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return await this.getSessionsByDateRange(startOfMonth, endOfMonth);
  }

  public async calculateSessionDuration(sessionId: number): Promise<number> {
    const session = await this.repository.getById(sessionId);
    if (!session) {
      throw new Error(`Time session with ID ${sessionId} not found`);
    }

    return session.calculateDuration();
  }

  public async updateSessionDuration(sessionId: number): Promise<TimeSession> {
    const duration = await this.calculateSessionDuration(sessionId);
    const updatedSession = await this.repository.update(sessionId, {
      durationSeconds: duration,
    });

    return updatedSession.toJSON();
  }
}
