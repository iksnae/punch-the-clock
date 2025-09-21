import { TimeSession, TimeSessionState } from '../types/TimeSession';

export class TimeCalculations {
  public static calculateDuration(startTime: Date, endTime: Date): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  public static calculateSessionDuration(session: TimeSession): number {
    const now = new Date();
    let totalDuration = 0;

    if (session.stoppedAt) {
      // Session is completed
      totalDuration = this.calculateDuration(session.startedAt, session.stoppedAt);
    } else if (session.pausedAt && !session.resumedAt) {
      // Session is paused
      totalDuration = this.calculateDuration(session.startedAt, session.pausedAt);
    } else if (session.resumedAt) {
      // Session was paused and resumed
      const pausedDuration = this.calculateDuration(session.startedAt, session.pausedAt!);
      const resumedDuration = this.calculateDuration(session.resumedAt, now);
      totalDuration = pausedDuration + resumedDuration;
    } else {
      // Session is active
      totalDuration = this.calculateDuration(session.startedAt, now);
    }

    return totalDuration;
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

  public static formatDurationShort(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
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

  public static parseTimeEstimate(estimate: string): number {
    // Parse time estimates like "2h", "30m", "1d", "2.5h"
    const regex = /^(\d+(?:\.\d+)?)\s*(h|m|d|s)$/i;
    const match = estimate.match(regex);
    
    if (!match) {
      throw new Error('Invalid time estimate format. Use format like "2h", "30m", "1d", or "2.5h"');
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'h':
        return value * 3600; // hours to seconds
      case 'm':
        return value * 60; // minutes to seconds
      case 'd':
        return value * 24 * 3600; // days to seconds
      case 's':
        return value; // already in seconds
      default:
        throw new Error('Invalid time unit');
    }
  }

  public static formatTimeEstimate(seconds: number): string {
    const hours = seconds / 3600;
    
    if (hours >= 1) {
      if (hours === Math.floor(hours)) {
        return `${Math.floor(hours)}h`;
      } else {
        return `${hours.toFixed(1)}h`;
      }
    } else {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    }
  }

  public static getTimeOfDay(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  }

  public static getDateString(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  public static isToday(date: Date): boolean {
    const today = new Date();
    return this.getDateString(date) === this.getDateString(today);
  }

  public static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.getDateString(date) === this.getDateString(yesterday);
  }

  public static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return this.getDateString(date);
    }
  }

  public static calculateVelocity(completedTasks: number, timePeriod: number): number {
    // Velocity as tasks per day
    return completedTasks / timePeriod;
  }

  public static calculateEstimationAccuracy(estimated: number, actual: number): number {
    if (estimated === 0) return 0;
    return Math.abs((actual - estimated) / estimated) * 100;
  }

  public static calculateEstimationBias(estimated: number, actual: number): number {
    if (estimated === 0) return 0;
    return ((actual - estimated) / estimated) * 100;
  }

  public static getWorkingHours(startTime: Date, endTime: Date): number {
    // Simple calculation assuming 8-hour work days
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const workingHours = diffDays * 8;
    
    // Add partial day hours
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const partialHours = Math.max(0, Math.min(8, endHour - startHour));
    
    return workingHours + partialHours;
  }

  public static isWithinWorkingHours(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 9 && hour <= 17; // 9 AM to 5 PM
  }

  public static getNextWorkingDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  public static getSessionStatus(session: TimeSession): TimeSessionState {
    if (session.stoppedAt) {
      return 'stopped';
    } else if (session.pausedAt && !session.resumedAt) {
      return 'paused';
    } else {
      return 'active';
    }
  }
}
