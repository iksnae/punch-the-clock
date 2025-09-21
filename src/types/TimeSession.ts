// TimeSession data types and interfaces

export type TimeSessionState = 'active' | 'paused' | 'stopped';

export interface TimeSession {
  id: number;
  taskId: number;
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  stoppedAt?: Date;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimeSessionData {
  taskId: number;
  startedAt?: Date;
}

export interface UpdateTimeSessionData {
  pausedAt?: Date;
  resumedAt?: Date;
  stoppedAt?: Date;
  durationSeconds?: number;
}

export interface TimeSessionFilters {
  taskId?: number;
  startedFrom?: Date;
  startedTo?: Date;
  state?: TimeSessionState;
}

export interface TimeSessionStats {
  totalSessions: number;
  totalDuration: number; // in seconds
  averageDuration: number; // in seconds
  longestSession: number; // in seconds
  shortestSession: number; // in seconds
  activeSessions: number;
  pausedSessions: number;
  completedSessions: number;
}

export interface TimeSessionWithTask extends TimeSession {
  task: {
    id: number;
    number: string;
    title: string;
    projectId: number;
  };
}

export interface TimeCalculationResult {
  totalDuration: number; // in seconds
  activeDuration: number; // in seconds (excluding paused time)
  pausedDuration: number; // in seconds
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}
