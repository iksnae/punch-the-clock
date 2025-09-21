import { TimeSession, CreateTimeSessionData, UpdateTimeSessionData, TimeSessionState, TimeCalculationResult } from '../types/TimeSession';

export class TimeSessionModel {
  constructor(private data: TimeSession) {}

  public getId(): number {
    return this.data.id;
  }

  public getTaskId(): number {
    return this.data.taskId;
  }

  public getStartedAt(): Date {
    return this.data.startedAt;
  }

  public getPausedAt(): Date | undefined {
    return this.data.pausedAt;
  }

  public getResumedAt(): Date | undefined {
    return this.data.resumedAt;
  }

  public getStoppedAt(): Date | undefined {
    return this.data.stoppedAt;
  }

  public getDurationSeconds(): number {
    return this.data.durationSeconds;
  }

  public getCreatedAt(): Date {
    return this.data.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.data.updatedAt;
  }

  public getData(): TimeSession {
    return { ...this.data };
  }

  public getState(): TimeSessionState {
    if (this.data.stoppedAt) {
      return 'stopped';
    }
    if (this.data.pausedAt && !this.data.resumedAt) {
      return 'paused';
    }
    return 'active';
  }

  public update(updates: UpdateTimeSessionData): void {
    if (updates.pausedAt !== undefined) {
      this.data.pausedAt = updates.pausedAt;
    }
    if (updates.resumedAt !== undefined) {
      this.data.resumedAt = updates.resumedAt;
    }
    if (updates.stoppedAt !== undefined) {
      this.data.stoppedAt = updates.stoppedAt;
    }
    if (updates.durationSeconds !== undefined) {
      this.data.durationSeconds = updates.durationSeconds;
    }
    this.data.updatedAt = new Date();
  }

  public pause(pauseTime: Date = new Date()): void {
    if (this.getState() !== 'active') {
      throw new Error('Can only pause active sessions');
    }
    this.data.pausedAt = pauseTime;
    this.data.updatedAt = new Date();
  }

  public resume(resumeTime: Date = new Date()): void {
    if (this.getState() !== 'paused') {
      throw new Error('Can only resume paused sessions');
    }
    this.data.resumedAt = resumeTime;
    this.data.updatedAt = new Date();
  }

  public stop(stopTime: Date = new Date()): void {
    if (this.getState() === 'stopped') {
      throw new Error('Session is already stopped');
    }
    this.data.stoppedAt = stopTime;
    this.calculateDuration();
    this.data.updatedAt = new Date();
  }

  public calculateDuration(): number {
    const now = new Date();
    let totalDuration = 0;

    if (this.data.stoppedAt) {
      // Session is completed
      totalDuration = this.calculateDurationBetween(this.data.startedAt, this.data.stoppedAt);
    } else if (this.data.pausedAt && !this.data.resumedAt) {
      // Session is paused
      totalDuration = this.calculateDurationBetween(this.data.startedAt, this.data.pausedAt);
    } else if (this.data.resumedAt) {
      // Session was paused and resumed
      const pausedDuration = this.calculateDurationBetween(this.data.startedAt, this.data.pausedAt!);
      const resumedDuration = this.calculateDurationBetween(this.data.resumedAt, now);
      totalDuration = pausedDuration + resumedDuration;
    } else {
      // Session is active
      totalDuration = this.calculateDurationBetween(this.data.startedAt, now);
    }

    this.data.durationSeconds = totalDuration;
    return totalDuration;
  }

  public getDetailedCalculation(): TimeCalculationResult {
    const now = new Date();
    let totalDuration = 0;
    let activeDuration = 0;
    let pausedDuration = 0;

    if (this.data.stoppedAt) {
      // Session is completed
      totalDuration = this.calculateDurationBetween(this.data.startedAt, this.data.stoppedAt);
      activeDuration = totalDuration;
    } else if (this.data.pausedAt && !this.data.resumedAt) {
      // Session is paused
      totalDuration = this.calculateDurationBetween(this.data.startedAt, this.data.pausedAt);
      activeDuration = totalDuration;
    } else if (this.data.resumedAt) {
      // Session was paused and resumed
      const pausedDuration1 = this.calculateDurationBetween(this.data.startedAt, this.data.pausedAt!);
      const resumedDuration = this.calculateDurationBetween(this.data.resumedAt, now);
      totalDuration = pausedDuration1 + resumedDuration;
      activeDuration = pausedDuration1 + resumedDuration;
      pausedDuration = this.calculateDurationBetween(this.data.pausedAt!, this.data.resumedAt);
    } else {
      // Session is active
      totalDuration = this.calculateDurationBetween(this.data.startedAt, now);
      activeDuration = totalDuration;
    }

    return {
      totalDuration,
      activeDuration,
      pausedDuration,
      isActive: this.getState() === 'active',
      isPaused: this.getState() === 'paused',
      isCompleted: this.getState() === 'stopped',
    };
  }

  private calculateDurationBetween(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  }

  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.data.taskId || this.data.taskId <= 0) {
      errors.push('Valid task ID is required');
    }

    if (!this.data.startedAt) {
      errors.push('Start time is required');
    }

    if (this.data.pausedAt && this.data.pausedAt <= this.data.startedAt) {
      errors.push('Pause time must be after start time');
    }

    if (this.data.resumedAt && this.data.pausedAt && this.data.resumedAt <= this.data.pausedAt) {
      errors.push('Resume time must be after pause time');
    }

    if (this.data.stoppedAt) {
      if (this.data.stoppedAt <= this.data.startedAt) {
        errors.push('Stop time must be after start time');
      }
      if (this.data.pausedAt && this.data.stoppedAt <= this.data.pausedAt) {
        errors.push('Stop time must be after pause time');
      }
      if (this.data.resumedAt && this.data.stoppedAt <= this.data.resumedAt) {
        errors.push('Stop time must be after resume time');
      }
    }

    if (this.data.durationSeconds < 0) {
      errors.push('Duration cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static create(data: CreateTimeSessionData): TimeSessionModel {
    const now = new Date();
    const timeSession: TimeSession = {
      id: 0, // Will be set by database
      taskId: data.taskId,
      startedAt: data.startedAt || now,
      pausedAt: undefined,
      resumedAt: undefined,
      stoppedAt: undefined,
      durationSeconds: 0,
      createdAt: now,
      updatedAt: now,
    };

    return new TimeSessionModel(timeSession);
  }

  public static fromDatabaseRow(row: any): TimeSessionModel {
    const timeSession: TimeSession = {
      id: row.id,
      taskId: row.task_id,
      startedAt: new Date(row.started_at),
      pausedAt: row.paused_at ? new Date(row.paused_at) : undefined,
      resumedAt: row.resumed_at ? new Date(row.resumed_at) : undefined,
      stoppedAt: row.stopped_at ? new Date(row.stopped_at) : undefined,
      durationSeconds: row.duration_seconds,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return new TimeSessionModel(timeSession);
  }

  public toDatabaseRow(): any {
    return {
      id: this.data.id,
      task_id: this.data.taskId,
      started_at: this.data.startedAt,
      paused_at: this.data.pausedAt,
      resumed_at: this.data.resumedAt,
      stopped_at: this.data.stoppedAt,
      duration_seconds: this.data.durationSeconds,
      created_at: this.data.createdAt,
      updated_at: this.data.updatedAt,
    };
  }

  public toJSON(): TimeSession {
    return this.getData();
  }
}
