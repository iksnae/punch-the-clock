import { TimeSession } from '../types/TimeSession';
import { TimeCalculations } from '../utils/timeCalculations';

export interface TimeReportData {
  totalTime: number; // in seconds
  sessionCount: number;
  averageSessionTime: number; // in seconds
  longestSession: number; // in seconds
  shortestSession: number; // in seconds
  sessions: TimeSession[];
}

export interface TimeReportFilters {
  projectId?: number;
  taskId?: number;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  groupBy?: 'project' | 'task' | 'tags' | 'day' | 'week' | 'month';
}

export interface GroupedTimeReport {
  group: string;
  totalTime: number;
  sessionCount: number;
  averageSessionTime: number;
  sessions: TimeSession[];
}

export class TimeReport {
  private data: TimeReportData;
  private filters: TimeReportFilters;

  constructor(data: TimeReportData, filters: TimeReportFilters) {
    this.data = data;
    this.filters = filters;
  }

  public getTotalTime(): number {
    return this.data.totalTime;
  }

  public getTotalTimeFormatted(): string {
    return TimeCalculations.formatDuration(this.data.totalTime);
  }

  public getSessionCount(): number {
    return this.data.sessionCount;
  }

  public getAverageSessionTime(): number {
    return this.data.averageSessionTime;
  }

  public getAverageSessionTimeFormatted(): string {
    return TimeCalculations.formatDuration(this.data.averageSessionTime);
  }

  public getLongestSession(): number {
    return this.data.longestSession;
  }

  public getLongestSessionFormatted(): string {
    return TimeCalculations.formatDuration(this.data.longestSession);
  }

  public getShortestSession(): number {
    return this.data.shortestSession;
  }

  public getShortestSessionFormatted(): string {
    return TimeCalculations.formatDuration(this.data.shortestSession);
  }

  public getSessions(): TimeSession[] {
    return [...this.data.sessions];
  }

  public getFilters(): TimeReportFilters {
    return { ...this.filters };
  }

  public getData(): TimeReportData {
    return { ...this.data };
  }

  public groupBy(groupBy: 'project' | 'task' | 'tags' | 'day' | 'week' | 'month'): GroupedTimeReport[] {
    const groups: Map<string, TimeSession[]> = new Map();

    for (const session of this.data.sessions) {
      let groupKey: string;

      switch (groupBy) {
        case 'project':
          groupKey = `Project ${session.taskId}`; // Would need task info for actual project name
          break;
        case 'task':
          groupKey = `Task ${session.taskId}`;
          break;
        case 'tags':
          groupKey = 'All Sessions'; // Would need task info for actual tags
          break;
        case 'day':
          groupKey = TimeCalculations.getDateString(session.startedAt);
          break;
        case 'week':
          const weekStart = new Date(session.startedAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          groupKey = TimeCalculations.getDateString(weekStart);
          break;
        case 'month':
          const monthStart = new Date(session.startedAt.getFullYear(), session.startedAt.getMonth(), 1);
          groupKey = TimeCalculations.getDateString(monthStart);
          break;
        default:
          groupKey = 'All Sessions';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(session);
    }

    return Array.from(groups.entries()).map(([group, sessions]) => {
      const totalTime = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
      const averageSessionTime = sessions.length > 0 ? totalTime / sessions.length : 0;

      return {
        group,
        totalTime,
        sessionCount: sessions.length,
        averageSessionTime,
        sessions: [...sessions],
      };
    }).sort((a, b) => b.totalTime - a.totalTime);
  }

  public getTopTasks(limit: number = 10): Array<{ taskId: number; totalTime: number; sessionCount: number }> {
    const taskStats: Map<number, { totalTime: number; sessionCount: number }> = new Map();

    for (const session of this.data.sessions) {
      if (!taskStats.has(session.taskId)) {
        taskStats.set(session.taskId, { totalTime: 0, sessionCount: 0 });
      }
      
      const stats = taskStats.get(session.taskId)!;
      stats.totalTime += session.durationSeconds;
      stats.sessionCount += 1;
    }

    return Array.from(taskStats.entries())
      .map(([taskId, stats]) => ({ taskId, ...stats }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  public getDailyBreakdown(): Array<{ date: string; totalTime: number; sessionCount: number }> {
    const dailyStats: Map<string, { totalTime: number; sessionCount: number }> = new Map();

    for (const session of this.data.sessions) {
      const date = TimeCalculations.getDateString(session.startedAt);
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { totalTime: 0, sessionCount: 0 });
      }
      
      const stats = dailyStats.get(date)!;
      stats.totalTime += session.durationSeconds;
      stats.sessionCount += 1;
    }

    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  public getWeeklyBreakdown(): Array<{ week: string; totalTime: number; sessionCount: number }> {
    const weeklyStats: Map<string, { totalTime: number; sessionCount: number }> = new Map();

    for (const session of this.data.sessions) {
      const weekStart = new Date(session.startedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const week = TimeCalculations.getDateString(weekStart);
      
      if (!weeklyStats.has(week)) {
        weeklyStats.set(week, { totalTime: 0, sessionCount: 0 });
      }
      
      const stats = weeklyStats.get(week)!;
      stats.totalTime += session.durationSeconds;
      stats.sessionCount += 1;
    }

    return Array.from(weeklyStats.entries())
      .map(([week, stats]) => ({ week, ...stats }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  public getMonthlyBreakdown(): Array<{ month: string; totalTime: number; sessionCount: number }> {
    const monthlyStats: Map<string, { totalTime: number; sessionCount: number }> = new Map();

    for (const session of this.data.sessions) {
      const monthStart = new Date(session.startedAt.getFullYear(), session.startedAt.getMonth(), 1);
      const month = TimeCalculations.getDateString(monthStart);
      
      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { totalTime: 0, sessionCount: 0 });
      }
      
      const stats = monthlyStats.get(month)!;
      stats.totalTime += session.durationSeconds;
      stats.sessionCount += 1;
    }

    return Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  public toJSON(): any {
    return {
      filters: this.filters,
      data: this.data,
      summary: {
        totalTime: this.data.totalTime,
        totalTimeFormatted: this.getTotalTimeFormatted(),
        sessionCount: this.data.sessionCount,
        averageSessionTime: this.data.averageSessionTime,
        averageSessionTimeFormatted: this.getAverageSessionTimeFormatted(),
        longestSession: this.data.longestSession,
        longestSessionFormatted: this.getLongestSessionFormatted(),
        shortestSession: this.data.shortestSession,
        shortestSessionFormatted: this.getShortestSessionFormatted(),
      },
    };
  }
}
