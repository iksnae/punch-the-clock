import { CreateTimeSessionData, UpdateTimeSessionData, TimeSessionState } from '../types/TimeSession';

export class TimeSessionValidator {
  public static validateCreateData(data: CreateTimeSessionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.taskId || data.taskId <= 0) {
      errors.push('Valid task ID is required');
    }

    if (data.startedAt && data.startedAt > new Date()) {
      errors.push('Start time cannot be in the future');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static validateUpdateData(data: UpdateTimeSessionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.pausedAt && data.pausedAt > new Date()) {
      errors.push('Pause time cannot be in the future');
    }

    if (data.resumedAt && data.resumedAt > new Date()) {
      errors.push('Resume time cannot be in the future');
    }

    if (data.stoppedAt && data.stoppedAt > new Date()) {
      errors.push('Stop time cannot be in the future');
    }

    if (data.durationSeconds !== undefined && data.durationSeconds < 0) {
      errors.push('Duration cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static validateTimeSequence(
    startedAt: Date,
    pausedAt?: Date,
    resumedAt?: Date,
    stoppedAt?: Date
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (pausedAt && pausedAt <= startedAt) {
      errors.push('Pause time must be after start time');
    }

    if (resumedAt && pausedAt && resumedAt <= pausedAt) {
      errors.push('Resume time must be after pause time');
    }

    if (stoppedAt) {
      if (stoppedAt <= startedAt) {
        errors.push('Stop time must be after start time');
      }
      if (pausedAt && stoppedAt <= pausedAt) {
        errors.push('Stop time must be after pause time');
      }
      if (resumedAt && stoppedAt <= resumedAt) {
        errors.push('Stop time must be after resume time');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static validateStateTransition(
    fromState: TimeSessionState,
    toState: TimeSessionState
  ): { valid: boolean; reason?: string } {
    const validTransitions: Record<TimeSessionState, TimeSessionState[]> = {
      'active': ['paused', 'stopped'],
      'paused': ['active', 'stopped'],
      'stopped': [], // Cannot transition from stopped
    };

    if (!validTransitions[fromState].includes(toState)) {
      return {
        valid: false,
        reason: `Cannot transition from ${fromState} to ${toState}`,
      };
    }

    return { valid: true };
  }

  public static sanitizeDate(date?: Date): Date | undefined {
    if (!date) return undefined;
    
    // Ensure date is not in the future
    const now = new Date();
    if (date > now) {
      return now;
    }
    
    return date;
  }

  public static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  public static parseDuration(duration: string): number {
    // Parse duration strings like "2h 30m", "1h", "45m", "30s"
    const regex = /(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
    const match = duration.match(regex);
    
    if (!match) {
      throw new Error('Invalid duration format');
    }

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  public static validateDurationString(duration: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const seconds = this.parseDuration(duration);
      if (seconds <= 0) {
        errors.push('Duration must be positive');
      }
    } catch (error) {
      errors.push('Invalid duration format. Use format like "2h 30m", "1h", "45m", or "30s"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
