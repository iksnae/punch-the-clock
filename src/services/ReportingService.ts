import { TimeTrackingService } from './TimeTrackingService';
import { TaskService } from './TaskService';
import { ProjectService } from './ProjectService';
import { TimeReport, TimeReportData, TimeReportFilters } from '../reports/TimeReport';
import { VelocityReport, VelocityReportData, VelocityReportFilters, VelocityTrend } from '../reports/VelocityReport';
import { EstimationReport, EstimationReportData, EstimationReportFilters, EstimationAccuracy, EstimationTrend } from '../reports/EstimationReport';
import { TimeSession } from '../types/TimeSession';
import { Task } from '../types/Task';
import { TimeCalculations } from '../utils/timeCalculations';

export class ReportingService {
  private timeTrackingService: TimeTrackingService;
  private taskService: TaskService;
  private projectService: ProjectService;

  constructor(
    timeTrackingService: TimeTrackingService,
    taskService: TaskService,
    projectService: ProjectService
  ) {
    this.timeTrackingService = timeTrackingService;
    this.taskService = taskService;
    this.projectService = projectService;
  }

  public async getTimeReport(filters: TimeReportFilters): Promise<TimeReport> {
    const sessions = await this.getFilteredSessions(filters);
    
    const totalTime = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    const sessionCount = sessions.length;
    const averageSessionTime = sessionCount > 0 ? totalTime / sessionCount : 0;
    const longestSession = sessionCount > 0 ? Math.max(...sessions.map(s => s.durationSeconds)) : 0;
    const shortestSession = sessionCount > 0 ? Math.min(...sessions.map(s => s.durationSeconds)) : 0;

    const data: TimeReportData = {
      totalTime,
      sessionCount,
      averageSessionTime,
      longestSession,
      shortestSession,
      sessions,
    };

    return new TimeReport(data, filters);
  }

  public async getVelocityReport(filters: VelocityReportFilters): Promise<VelocityReport> {
    const { fromDate, toDate, period } = filters;
    
    // Get tasks and sessions for the period
    const tasks = await this.getFilteredTasks(filters);
    const sessions = await this.getFilteredSessions(filters);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.state === 'completed').length;
    const totalTimeSpent = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    const averageTaskTime = completedTasks > 0 ? totalTimeSpent / completedTasks : 0;
    
    // Calculate velocity (tasks per period)
    const periodDays = this.getPeriodDays(fromDate, toDate, period);
    const velocity = periodDays > 0 ? completedTasks / periodDays : 0;
    const throughput = periodDays > 0 ? completedTasks / periodDays : 0;
    
    // Calculate cycle time and lead time (simplified)
    const cycleTime = averageTaskTime;
    const leadTime = averageTaskTime; // Would need actual creation to completion data

    const data: VelocityReportData = {
      period,
      totalTasks,
      completedTasks,
      totalTimeSpent,
      averageTaskTime,
      velocity,
      throughput,
      cycleTime,
      leadTime,
    };

    // Generate trends (simplified - would need historical data)
    const trends = await this.generateVelocityTrends(filters);

    return new VelocityReport(data, filters, trends);
  }

  public async getEstimationReport(filters: EstimationReportFilters): Promise<EstimationReport> {
    const tasks = await this.getFilteredTasks(filters);
    const sessions = await this.getFilteredSessions(filters);
    
    const totalTasks = tasks.length;
    const tasksWithEstimates = tasks.filter(task => 
      task.sizeEstimate !== undefined || task.timeEstimateHours !== undefined
    ).length;
    const tasksWithTimeEstimates = tasks.filter(task => 
      task.timeEstimateHours !== undefined
    ).length;
    const tasksWithSizeEstimates = tasks.filter(task => 
      task.sizeEstimate !== undefined
    ).length;

    // Calculate averages
    const tasksWithTimeEst = tasks.filter(task => task.timeEstimateHours !== undefined);
    const tasksWithSizeEst = tasks.filter(task => task.sizeEstimate !== undefined);
    
    const averageTimeEstimate = tasksWithTimeEst.length > 0 
      ? tasksWithTimeEst.reduce((sum, task) => sum + (task.timeEstimateHours! * 3600), 0) / tasksWithTimeEst.length
      : 0;
    
    const averageSizeEstimate = tasksWithSizeEst.length > 0
      ? tasksWithSizeEst.reduce((sum, task) => sum + task.sizeEstimate!, 0) / tasksWithSizeEst.length
      : 0;

    // Calculate actual averages
    const taskTimeMap = new Map<number, number>();
    for (const session of sessions) {
      const current = taskTimeMap.get(session.taskId) || 0;
      taskTimeMap.set(session.taskId, current + session.durationSeconds);
    }

    const actualTimes = Array.from(taskTimeMap.values());
    const averageActualTime = actualTimes.length > 0 
      ? actualTimes.reduce((sum, time) => sum + time, 0) / actualTimes.length
      : 0;

    // Calculate accuracy and bias
    const accuracy = await this.calculateEstimationAccuracy(tasks, taskTimeMap);
    const sizeAccuracy = this.calculateSizeAccuracy(accuracy);
    const timeAccuracy = this.calculateTimeAccuracy(accuracy);
    const sizeBias = this.calculateSizeBias(accuracy);
    const timeBias = this.calculateTimeBias(accuracy);

    const data: EstimationReportData = {
      totalTasks,
      tasksWithEstimates,
      tasksWithTimeEstimates,
      tasksWithSizeEstimates,
      averageSizeEstimate,
      averageTimeEstimate,
      averageActualTime,
      averageActualSize: averageSizeEstimate, // Simplified
      sizeAccuracy,
      timeAccuracy,
      sizeBias,
      timeBias,
    };

    // Generate trends (simplified)
    const trends = await this.generateEstimationTrends(filters);

    return new EstimationReport(data, filters, accuracy, trends);
  }

  private async getFilteredSessions(filters: any): Promise<TimeSession[]> {
    const sessionFilters: any = {};

    if (filters.fromDate) {
      sessionFilters.startedFrom = filters.fromDate;
    }
    if (filters.toDate) {
      sessionFilters.startedTo = filters.toDate;
    }
    if (filters.taskId) {
      sessionFilters.taskId = filters.taskId;
    }

    return await this.timeTrackingService.listSessions(sessionFilters);
  }

  private async getFilteredTasks(filters: any): Promise<Task[]> {
    const taskFilters: any = {};

    if (filters.projectId) {
      taskFilters.projectId = filters.projectId;
    }

    // Get all tasks for the project(s)
    if (filters.projectId) {
      return await this.taskService.listTasks(filters.projectId, taskFilters);
    } else {
      // Get tasks from all projects
      const projects = await this.projectService.listProjects();
      const allTasks: Task[] = [];
      
      for (const project of projects) {
        const projectTasks = await this.taskService.listTasks(project.id, taskFilters);
        allTasks.push(...projectTasks);
      }
      
      return allTasks;
    }
  }

  private getPeriodDays(fromDate?: Date, toDate?: Date, period: 'week' | 'month' = 'week'): number {
    if (!fromDate || !toDate) {
      return period === 'week' ? 7 : 30;
    }
    
    const diffMs = toDate.getTime() - fromDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  private async generateVelocityTrends(filters: VelocityReportFilters): Promise<VelocityTrend[]> {
    // Simplified trend generation - would need historical data
    const trends: VelocityTrend[] = [];
    const { fromDate, toDate, period } = filters;
    
    if (!fromDate || !toDate) {
      return trends;
    }

    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const periodEnd = new Date(currentDate);
      if (period === 'week') {
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const periodFilters = { ...filters, fromDate: currentDate, toDate: periodEnd };
      const tasks = await this.getFilteredTasks(periodFilters);
      const sessions = await this.getFilteredSessions(periodFilters);
      
      const completedTasks = tasks.filter(task => task.state === 'completed').length;
      const totalTimeSpent = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
      const periodDays = this.getPeriodDays(currentDate, periodEnd, period);
      
      trends.push({
        period: TimeCalculations.getDateString(currentDate),
        velocity: periodDays > 0 ? completedTasks / periodDays : 0,
        throughput: periodDays > 0 ? completedTasks / periodDays : 0,
        completedTasks,
        totalTimeSpent,
      });

      if (period === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return trends;
  }

  private async calculateEstimationAccuracy(tasks: Task[], taskTimeMap: Map<number, number>): Promise<EstimationAccuracy[]> {
    const accuracy: EstimationAccuracy[] = [];

    for (const task of tasks) {
      const actualTime = taskTimeMap.get(task.id);
      const timeEstimate = task.timeEstimateHours ? task.timeEstimateHours * 3600 : undefined;
      
      let timeAccuracy: number | undefined;
      let timeBias: number | undefined;
      
      if (timeEstimate && actualTime) {
        timeAccuracy = TimeCalculations.calculateEstimationAccuracy(timeEstimate, actualTime);
        timeBias = TimeCalculations.calculateEstimationBias(timeEstimate, actualTime);
      }

      accuracy.push({
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.title,
        sizeEstimate: task.sizeEstimate,
        timeEstimate,
        actualTime,
        timeAccuracy,
        timeBias,
      });
    }

    return accuracy;
  }

  private calculateSizeAccuracy(accuracy: EstimationAccuracy[]): number {
    const sizeEstimates = accuracy.filter(a => a.sizeEstimate !== undefined);
    if (sizeEstimates.length === 0) return 0;
    
    // Simplified - would need actual size data
    return 75; // Placeholder
  }

  private calculateTimeAccuracy(accuracy: EstimationAccuracy[]): number {
    const timeEstimates = accuracy.filter(a => a.timeAccuracy !== undefined);
    if (timeEstimates.length === 0) return 0;
    
    const totalAccuracy = timeEstimates.reduce((sum, a) => sum + (a.timeAccuracy || 0), 0);
    return totalAccuracy / timeEstimates.length;
  }

  private calculateSizeBias(accuracy: EstimationAccuracy[]): number {
    // Simplified - would need actual size data
    return 0; // Placeholder
  }

  private calculateTimeBias(accuracy: EstimationAccuracy[]): number {
    const timeEstimates = accuracy.filter(a => a.timeBias !== undefined);
    if (timeEstimates.length === 0) return 0;
    
    const totalBias = timeEstimates.reduce((sum, a) => sum + (a.timeBias || 0), 0);
    return totalBias / timeEstimates.length;
  }

  private async generateEstimationTrends(filters: EstimationReportFilters): Promise<EstimationTrend[]> {
    // Simplified trend generation - would need historical data
    return [];
  }
}
