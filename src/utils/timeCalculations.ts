import { format, formatDistanceToNow, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
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
    if (seconds < 0) seconds = 0; // Ensure no negative durations

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`); // Always show seconds if no other parts, or if there are remaining seconds

    return parts.join(' ');
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

  public static parseDuration(durationString: string): number {
    let totalSeconds = 0;
    const parts = durationString.match(/(\d+)([dhms])/g);

    if (!parts) {
      return 0;
    }

    for (const part of parts) {
      const value = parseInt(part.slice(0, -1));
      const unit = part.slice(-1);

      switch (unit) {
        case 'd':
          totalSeconds += value * 86400;
          break;
        case 'h':
          totalSeconds += value * 3600;
          break;
        case 'm':
          totalSeconds += value * 60;
          break;
        case 's':
          totalSeconds += value;
          break;
      }
    }
    return totalSeconds;
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
    return this.formatDuration(seconds);
  }

  public static getTimeOfDay(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    const seconds = d.getUTCSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  public static getDateString(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
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

  public static getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
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

  public static getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  public static getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  public static getStartOfWeek(date: Date): Date {
    return startOfWeek(date);
  }

  public static getEndOfWeek(date: Date): Date {
    return endOfWeek(date);
  }

  public static getStartOfMonth(date: Date): Date {
    return startOfMonth(date);
  }

  public static getEndOfMonth(date: Date): Date {
    return endOfMonth(date);
  }
}
