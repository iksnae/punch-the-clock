import { TimeCalculations } from '../utils/timeCalculations';

export interface VelocityReportData {
  period: 'week' | 'month';
  totalTasks: number;
  completedTasks: number;
  totalTimeSpent: number; // in seconds
  averageTaskTime: number; // in seconds
  velocity: number; // tasks per period
  throughput: number; // tasks per day
  cycleTime: number; // average time from start to completion
  leadTime: number; // average time from creation to completion
}

export interface VelocityReportFilters {
  projectId?: number;
  fromDate?: Date;
  toDate?: Date;
  period: 'week' | 'month';
}

export interface VelocityTrend {
  period: string;
  velocity: number;
  throughput: number;
  completedTasks: number;
  totalTimeSpent: number;
}

export class VelocityReport {
  private data: VelocityReportData;
  private filters: VelocityReportFilters;
  private trends: VelocityTrend[];

  constructor(data: VelocityReportData, filters: VelocityReportFilters, trends: VelocityTrend[] = []) {
    this.data = data;
    this.filters = filters;
    this.trends = trends;
  }

  public getPeriod(): 'week' | 'month' {
    return this.data.period;
  }

  public getTotalTasks(): number {
    return this.data.totalTasks;
  }

  public getCompletedTasks(): number {
    return this.data.completedTasks;
  }

  public getTotalTimeSpent(): number {
    return this.data.totalTimeSpent;
  }

  public getTotalTimeSpentFormatted(): string {
    return TimeCalculations.formatDuration(this.data.totalTimeSpent);
  }

  public getAverageTaskTime(): number {
    return this.data.averageTaskTime;
  }

  public getAverageTaskTimeFormatted(): string {
    return TimeCalculations.formatDuration(this.data.averageTaskTime);
  }

  public getVelocity(): number {
    return this.data.velocity;
  }

  public getThroughput(): number {
    return this.data.throughput;
  }

  public getCycleTime(): number {
    return this.data.cycleTime;
  }

  public getCycleTimeFormatted(): string {
    return TimeCalculations.formatDuration(this.data.cycleTime);
  }

  public getLeadTime(): number {
    return this.data.leadTime;
  }

  public getLeadTimeFormatted(): string {
    return TimeCalculations.formatDuration(this.data.leadTime);
  }

  public getCompletionRate(): number {
    if (this.data.totalTasks === 0) return 0;
    return (this.data.completedTasks / this.data.totalTasks) * 100;
  }

  public getTrends(): VelocityTrend[] {
    return [...this.trends];
  }

  public getFilters(): VelocityReportFilters {
    return { ...this.filters };
  }

  public getData(): VelocityReportData {
    return { ...this.data };
  }

  public getVelocityTrend(): { increasing: boolean; change: number } {
    if (this.trends.length < 2) {
      return { increasing: false, change: 0 };
    }

    const recent = this.trends[this.trends.length - 1];
    const previous = this.trends[this.trends.length - 2];
    
    const change = ((recent.velocity - previous.velocity) / previous.velocity) * 100;
    
    return {
      increasing: change > 0,
      change: Math.abs(change),
    };
  }

  public getThroughputTrend(): { increasing: boolean; change: number } {
    if (this.trends.length < 2) {
      return { increasing: false, change: 0 };
    }

    const recent = this.trends[this.trends.length - 1];
    const previous = this.trends[this.trends.length - 2];
    
    const change = ((recent.throughput - previous.throughput) / previous.throughput) * 100;
    
    return {
      increasing: change > 0,
      change: Math.abs(change),
    };
  }

  public getAverageVelocity(): number {
    if (this.trends.length === 0) return 0;
    
    const totalVelocity = this.trends.reduce((sum, trend) => sum + trend.velocity, 0);
    return totalVelocity / this.trends.length;
  }

  public getAverageThroughput(): number {
    if (this.trends.length === 0) return 0;
    
    const totalThroughput = this.trends.reduce((sum, trend) => sum + trend.throughput, 0);
    return totalThroughput / this.trends.length;
  }

  public getVelocityConsistency(): number {
    if (this.trends.length < 2) return 100;
    
    const velocities = this.trends.map(trend => trend.velocity);
    const average = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / velocities.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Return consistency as percentage (lower standard deviation = higher consistency)
    const coefficientOfVariation = standardDeviation / average;
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  public getProductivityScore(): number {
    // Simple productivity score based on velocity and completion rate
    const velocityScore = Math.min(100, (this.data.velocity / 10) * 100); // Assuming 10 tasks per period is excellent
    const completionScore = this.getCompletionRate();
    
    return (velocityScore + completionScore) / 2;
  }

  public getBurndownData(): Array<{ date: string; remainingTasks: number; completedTasks: number }> {
    // This would need actual burndown data from the database
    // For now, return empty array
    return [];
  }

  public getBurnupData(): Array<{ date: string; totalTasks: number; completedTasks: number }> {
    // This would need actual burnup data from the database
    // For now, return empty array
    return [];
  }

  public getForecast(periods: number = 4): Array<{ period: string; predictedVelocity: number; predictedTasks: number }> {
    if (this.trends.length < 2) {
      return [];
    }

    const forecast: Array<{ period: string; predictedVelocity: number; predictedTasks: number }> = [];
    const averageVelocity = this.getAverageVelocity();
    
    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date();
      if (this.data.period === 'week') {
        futureDate.setDate(futureDate.getDate() + (i * 7));
      } else {
        futureDate.setMonth(futureDate.getMonth() + i);
      }
      
      forecast.push({
        period: TimeCalculations.getDateString(futureDate),
        predictedVelocity: averageVelocity,
        predictedTasks: Math.round(averageVelocity),
      });
    }
    
    return forecast;
  }

  public toJSON(): any {
    return {
      filters: this.filters,
      data: this.data,
      trends: this.trends,
      summary: {
        period: this.data.period,
        totalTasks: this.data.totalTasks,
        completedTasks: this.data.completedTasks,
        totalTimeSpent: this.data.totalTimeSpent,
        totalTimeSpentFormatted: this.getTotalTimeSpentFormatted(),
        averageTaskTime: this.data.averageTaskTime,
        averageTaskTimeFormatted: this.getAverageTaskTimeFormatted(),
        velocity: this.data.velocity,
        throughput: this.data.throughput,
        cycleTime: this.data.cycleTime,
        cycleTimeFormatted: this.getCycleTimeFormatted(),
        leadTime: this.data.leadTime,
        leadTimeFormatted: this.getLeadTimeFormatted(),
        completionRate: this.getCompletionRate(),
        velocityTrend: this.getVelocityTrend(),
        throughputTrend: this.getThroughputTrend(),
        averageVelocity: this.getAverageVelocity(),
        averageThroughput: this.getAverageThroughput(),
        velocityConsistency: this.getVelocityConsistency(),
        productivityScore: this.getProductivityScore(),
      },
    };
  }
}
