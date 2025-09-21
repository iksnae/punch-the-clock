import { TimeCalculations } from '../utils/timeCalculations';

export interface EstimationReportData {
  totalTasks: number;
  tasksWithEstimates: number;
  tasksWithTimeEstimates: number;
  tasksWithSizeEstimates: number;
  averageSizeEstimate: number;
  averageTimeEstimate: number; // in seconds
  averageActualTime: number; // in seconds
  averageActualSize: number;
  sizeAccuracy: number; // percentage
  timeAccuracy: number; // percentage
  sizeBias: number; // percentage (positive = overestimated, negative = underestimated)
  timeBias: number; // percentage (positive = overestimated, negative = underestimated)
}

export interface EstimationReportFilters {
  projectId?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface EstimationAccuracy {
  taskId: number;
  taskNumber: string;
  taskTitle: string;
  sizeEstimate?: number;
  actualSize?: number;
  timeEstimate?: number; // in seconds
  actualTime?: number; // in seconds
  sizeAccuracy?: number; // percentage
  timeAccuracy?: number; // percentage
  sizeBias?: number; // percentage
  timeBias?: number; // percentage
}

export interface EstimationTrend {
  period: string;
  averageSizeAccuracy: number;
  averageTimeAccuracy: number;
  averageSizeBias: number;
  averageTimeBias: number;
  taskCount: number;
}

export class EstimationReport {
  private data: EstimationReportData;
  private filters: EstimationReportFilters;
  private accuracy: EstimationAccuracy[];
  private trends: EstimationTrend[];

  constructor(
    data: EstimationReportData, 
    filters: EstimationReportFilters, 
    accuracy: EstimationAccuracy[] = [],
    trends: EstimationTrend[] = []
  ) {
    this.data = data;
    this.filters = filters;
    this.accuracy = accuracy;
    this.trends = trends;
  }

  public getTotalTasks(): number {
    return this.data.totalTasks;
  }

  public getTasksWithEstimates(): number {
    return this.data.tasksWithEstimates;
  }

  public getTasksWithTimeEstimates(): number {
    return this.data.tasksWithTimeEstimates;
  }

  public getTasksWithSizeEstimates(): number {
    return this.data.tasksWithSizeEstimates;
  }

  public getAverageSizeEstimate(): number {
    return this.data.averageSizeEstimate;
  }

  public getAverageTimeEstimate(): number {
    return this.data.averageTimeEstimate;
  }

  public getAverageTimeEstimateFormatted(): string {
    return TimeCalculations.formatDuration(this.data.averageTimeEstimate);
  }

  public getAverageActualTime(): number {
    return this.data.averageActualTime;
  }

  public getAverageActualTimeFormatted(): string {
    return TimeCalculations.formatDuration(this.data.averageActualTime);
  }

  public getAverageActualSize(): number {
    return this.data.averageActualSize;
  }

  public getSizeAccuracy(): number {
    return this.data.sizeAccuracy;
  }

  public getTimeAccuracy(): number {
    return this.data.timeAccuracy;
  }

  public getSizeBias(): number {
    return this.data.sizeBias;
  }

  public getTimeBias(): number {
    return this.data.timeBias;
  }

  public getEstimationCoverage(): number {
    if (this.data.totalTasks === 0) return 0;
    return (this.data.tasksWithEstimates / this.data.totalTasks) * 100;
  }

  public getTimeEstimationCoverage(): number {
    if (this.data.totalTasks === 0) return 0;
    return (this.data.tasksWithTimeEstimates / this.data.totalTasks) * 100;
  }

  public getSizeEstimationCoverage(): number {
    if (this.data.totalTasks === 0) return 0;
    return (this.data.tasksWithSizeEstimates / this.data.totalTasks) * 100;
  }

  public getAccuracy(): EstimationAccuracy[] {
    return [...this.accuracy];
  }

  public getTrends(): EstimationTrend[] {
    return [...this.trends];
  }

  public getFilters(): EstimationReportFilters {
    return { ...this.filters };
  }

  public getData(): EstimationReportData {
    return { ...this.data };
  }

  public getTopOverestimatedTasks(limit: number = 10): EstimationAccuracy[] {
    return this.accuracy
      .filter(task => task.timeBias && task.timeBias > 0)
      .sort((a, b) => (b.timeBias || 0) - (a.timeBias || 0))
      .slice(0, limit);
  }

  public getTopUnderestimatedTasks(limit: number = 10): EstimationAccuracy[] {
    return this.accuracy
      .filter(task => task.timeBias && task.timeBias < 0)
      .sort((a, b) => (a.timeBias || 0) - (b.timeBias || 0))
      .slice(0, limit);
  }

  public getMostAccurateTasks(limit: number = 10): EstimationAccuracy[] {
    return this.accuracy
      .filter(task => task.timeAccuracy !== undefined)
      .sort((a, b) => (b.timeAccuracy || 0) - (a.timeAccuracy || 0))
      .slice(0, limit);
  }

  public getLeastAccurateTasks(limit: number = 10): EstimationAccuracy[] {
    return this.accuracy
      .filter(task => task.timeAccuracy !== undefined)
      .sort((a, b) => (a.timeAccuracy || 0) - (b.timeAccuracy || 0))
      .slice(0, limit);
  }

  public getEstimationTrend(): { improving: boolean; change: number } {
    if (this.trends.length < 2) {
      return { improving: false, change: 0 };
    }

    const recent = this.trends[this.trends.length - 1];
    const previous = this.trends[this.trends.length - 2];
    
    const change = recent.averageTimeAccuracy - previous.averageTimeAccuracy;
    
    return {
      improving: change > 0,
      change: Math.abs(change),
    };
  }

  public getBiasTrend(): { improving: boolean; change: number } {
    if (this.trends.length < 2) {
      return { improving: false, change: 0 };
    }

    const recent = this.trends[this.trends.length - 1];
    const previous = this.trends[this.trends.length - 2];
    
    const change = Math.abs(recent.averageTimeBias) - Math.abs(previous.averageTimeBias);
    
    return {
      improving: change < 0, // Improving means less bias
      change: Math.abs(change),
    };
  }

  public getEstimationQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const accuracy = this.getTimeAccuracy();
    
    if (accuracy >= 80) return 'excellent';
    if (accuracy >= 60) return 'good';
    if (accuracy >= 40) return 'fair';
    return 'poor';
  }

  public getEstimationConsistency(): number {
    if (this.accuracy.length < 2) return 100;
    
    const accuracies = this.accuracy
      .filter(task => task.timeAccuracy !== undefined)
      .map(task => task.timeAccuracy!);
    
    if (accuracies.length < 2) return 100;
    
    const average = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - average, 2), 0) / accuracies.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Return consistency as percentage (lower standard deviation = higher consistency)
    const coefficientOfVariation = standardDeviation / average;
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  public getSizeEstimationQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const accuracy = this.getSizeAccuracy();
    
    if (accuracy >= 80) return 'excellent';
    if (accuracy >= 60) return 'good';
    if (accuracy >= 40) return 'fair';
    return 'poor';
  }

  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.getEstimationCoverage() < 50) {
      recommendations.push('Increase estimation coverage - many tasks lack estimates');
    }
    
    if (this.getTimeAccuracy() < 60) {
      recommendations.push('Improve time estimation accuracy - consider breaking down tasks into smaller pieces');
    }
    
    if (Math.abs(this.getTimeBias()) > 20) {
      if (this.getTimeBias() > 0) {
        recommendations.push('Reduce overestimation bias - consider using historical data for better estimates');
      } else {
        recommendations.push('Reduce underestimation bias - tasks are taking longer than expected');
      }
    }
    
    if (this.getEstimationConsistency() < 70) {
      recommendations.push('Improve estimation consistency - establish estimation standards and training');
    }
    
    if (this.getSizeEstimationQuality() === 'poor') {
      recommendations.push('Improve size estimation - consider using story points or t-shirt sizing');
    }
    
    return recommendations;
  }

  public toJSON(): any {
    return {
      filters: this.filters,
      data: this.data,
      accuracy: this.accuracy,
      trends: this.trends,
      summary: {
        totalTasks: this.data.totalTasks,
        tasksWithEstimates: this.data.tasksWithEstimates,
        tasksWithTimeEstimates: this.data.tasksWithTimeEstimates,
        tasksWithSizeEstimates: this.data.tasksWithSizeEstimates,
        averageSizeEstimate: this.data.averageSizeEstimate,
        averageTimeEstimate: this.data.averageTimeEstimate,
        averageTimeEstimateFormatted: this.getAverageTimeEstimateFormatted(),
        averageActualTime: this.data.averageActualTime,
        averageActualTimeFormatted: this.getAverageActualTimeFormatted(),
        averageActualSize: this.data.averageActualSize,
        sizeAccuracy: this.data.sizeAccuracy,
        timeAccuracy: this.data.timeAccuracy,
        sizeBias: this.data.sizeBias,
        timeBias: this.data.timeBias,
        estimationCoverage: this.getEstimationCoverage(),
        timeEstimationCoverage: this.getTimeEstimationCoverage(),
        sizeEstimationCoverage: this.getSizeEstimationCoverage(),
        estimationQuality: this.getEstimationQuality(),
        sizeEstimationQuality: this.getSizeEstimationQuality(),
        estimationConsistency: this.getEstimationConsistency(),
        estimationTrend: this.getEstimationTrend(),
        biasTrend: this.getBiasTrend(),
        recommendations: this.getRecommendations(),
      },
    };
  }
}
