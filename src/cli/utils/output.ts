import chalk from 'chalk';
import { table } from 'table';
import { Project, ProjectStats } from '../../types/Project';
import { Task, TaskStats } from '../../types/Task';
import { TimeSession } from '../../types/TimeSession';
import { TimeCalculations } from '../../utils/timeCalculations';

export class OutputUtils {
  private static verbose: boolean = false;
  private static quiet: boolean = false;
  private static noColor: boolean = false;

  public static initialize(options: { verbose?: boolean; quiet?: boolean; noColor?: boolean }): void {
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
    this.noColor = options.noColor || false;
  }

  public static info(message: string): void {
    if (!this.quiet) {
      console.log(this.colorize(chalk.blue('ℹ'), message));
    }
  }

  public static success(message: string): void {
    if (!this.quiet) {
      console.log(this.colorize(chalk.green('✓'), message));
    }
  }

  public static warning(message: string): void {
    if (!this.quiet) {
      console.log(this.colorize(chalk.yellow('⚠'), message));
    }
  }

  public static error(message: string): void {
    console.error(this.colorize(chalk.red('✗'), message));
  }

  public static debug(message: string): void {
    if (this.verbose && !this.quiet) {
      console.log(this.colorize(chalk.gray('🐛'), message));
    }
  }

  public static verboseLog(message: string): void {
    if (this.verbose && !this.quiet) {
      console.log(this.colorize(chalk.gray('📝'), message));
    }
  }

  public static displayProjects(projects: Project[], format: string = 'table'): void {
    if (projects.length === 0) {
      this.info('No projects found');
      return;
    }

    if (format === 'json') {
      console.log(JSON.stringify(projects, null, 2));
      return;
    }

    const tableData = [
      ['ID', 'Name', 'Description', 'Created', 'Updated'],
      ...projects.map(project => [
        project.id.toString(),
        project.name,
        project.description || '',
        TimeCalculations.getDateString(project.createdAt),
        TimeCalculations.getDateString(project.updatedAt),
      ])
    ];

    console.log(table(tableData));
  }

  public static displayProjectDetails(project: Project, stats: ProjectStats): void {
    console.log(this.colorize('📋', 'Project Details'));
    console.log(this.colorize('─', '─'.repeat(50)));
    console.log(`Name: ${project.name}`);
    console.log(`ID: ${project.id}`);
    if (project.description) {
      console.log(`Description: ${project.description}`);
    }
    console.log(`Created: ${TimeCalculations.getDateString(project.createdAt)}`);
    console.log(`Updated: ${TimeCalculations.getDateString(project.updatedAt)}`);
    console.log();
    
    console.log(this.colorize('📊', 'Statistics'));
    console.log(this.colorize('─', '─'.repeat(50)));
    console.log(`Total Tasks: ${stats.totalTasks}`);
    console.log(`Completed Tasks: ${stats.completedTasks}`);
    console.log(`Total Time Spent: ${TimeCalculations.formatDuration(stats.totalTimeSpent)}`);
    console.log(`Average Task Time: ${TimeCalculations.formatDuration(stats.averageTaskTime)}`);
    if (stats.lastActivity) {
      console.log(`Last Activity: ${TimeCalculations.getRelativeTime(stats.lastActivity)}`);
    }
  }

  public static displayTasks(tasks: Task[], format: string = 'table'): void {
    if (tasks.length === 0) {
      this.info('No tasks found');
      return;
    }

    if (format === 'json') {
      console.log(JSON.stringify(tasks, null, 2));
      return;
    }

    const tableData = [
      ['ID', 'Number', 'Title', 'State', 'Estimate', 'Tags', 'Created'],
      ...tasks.map(task => {
        const estimate = task.timeEstimateHours 
          ? TimeCalculations.formatTimeEstimate(task.timeEstimateHours * 3600)
          : '';
        const tags = task.tags.join(', ');
        
        return [
          task.id.toString(),
          task.number,
          task.title.length > 25 ? task.title.substring(0, 22) + '...' : task.title,
          this.colorizeState(task.state),
          estimate,
          tags.length > 15 ? tags.substring(0, 12) + '...' : tags,
          TimeCalculations.getDateString(task.createdAt),
        ];
      })
    ];

    console.log(table(tableData));
  }

  public static displayTaskDetails(task: Task, stats?: TaskStats): void {
    console.log(this.colorize('📝', 'Task Details'));
    console.log(this.colorize('─', '─'.repeat(50)));
    console.log(`ID: ${task.id}`);
    console.log(`Number: ${task.number}`);
    console.log(`Title: ${task.title}`);
    if (task.description) {
      console.log(`Description: ${task.description}`);
    }
    console.log(`State: ${this.colorizeState(task.state)}`);
    if (task.sizeEstimate) {
      console.log(`Size Estimate: ${task.sizeEstimate} points`);
    }
    if (task.timeEstimateHours) {
      console.log(`Time Estimate: ${TimeCalculations.formatTimeEstimate(task.timeEstimateHours * 3600)}`);
    }
    if (task.tags.length > 0) {
      console.log(`Tags: ${task.tags.join(', ')}`);
    }
    console.log(`Created: ${TimeCalculations.getDateString(task.createdAt)}`);
    console.log(`Updated: ${TimeCalculations.getDateString(task.updatedAt)}`);
    
    if (stats) {
      console.log();
      console.log(this.colorize('📊', 'Statistics'));
      console.log(this.colorize('─', '─'.repeat(50)));
      console.log(`Total Time Spent: ${TimeCalculations.formatDuration(stats.totalTimeSpent)}`);
      console.log(`Session Count: ${stats.sessionCount}`);
      console.log(`Average Session Time: ${TimeCalculations.formatDuration(stats.averageSessionTime)}`);
      if (stats.lastActivity) {
        console.log(`Last Activity: ${TimeCalculations.getRelativeTime(stats.lastActivity)}`);
      }
    }
  }

  public static displayTimeSessions(sessions: TimeSession[], format: string = 'table'): void {
    if (sessions.length === 0) {
      this.info('No time sessions found');
      return;
    }

    if (format === 'json') {
      console.log(JSON.stringify(sessions, null, 2));
      return;
    }

    const tableData = [
      ['ID', 'Task ID', 'Started', 'Duration', 'State'],
      ...sessions.map(session => {
        const state = this.getSessionState(session);
        const duration = TimeCalculations.formatDuration(session.durationSeconds);
        const started = `${TimeCalculations.getDateString(session.startedAt)} ${TimeCalculations.getTimeOfDay(session.startedAt)}`;
        
        return [
          session.id.toString(),
          session.taskId.toString(),
          started,
          duration,
          this.colorizeSessionState(state),
        ];
      })
    ];

    console.log(table(tableData));
  }

  public static displayTimeReport(report: any): void {
    console.log(this.colorize('⏱️', 'Time Report'));
    console.log(this.colorize('─', '─'.repeat(50)));
    console.log(`Total Time: ${report.summary.totalTimeFormatted}`);
    console.log(`Session Count: ${report.summary.sessionCount}`);
    console.log(`Average Session Time: ${report.summary.averageSessionTimeFormatted}`);
    console.log(`Longest Session: ${report.summary.longestSessionFormatted}`);
    console.log(`Shortest Session: ${report.summary.shortestSessionFormatted}`);
  }

  public static displayVelocityReport(report: any): void {
    console.log(this.colorize('🚀', 'Velocity Report'));
    console.log(this.colorize('─', '─'.repeat(50)));
    console.log(`Period: ${report.summary.period}`);
    console.log(`Total Tasks: ${report.summary.totalTasks}`);
    console.log(`Completed Tasks: ${report.summary.completedTasks}`);
    console.log(`Velocity: ${report.summary.velocity.toFixed(2)} tasks/${report.summary.period}`);
    console.log(`Throughput: ${report.summary.throughput.toFixed(2)} tasks/day`);
    console.log(`Completion Rate: ${report.summary.completionRate.toFixed(1)}%`);
    console.log(`Productivity Score: ${report.summary.productivityScore.toFixed(1)}/100`);
  }

  public static displayEstimationReport(report: any): void {
    console.log(this.colorize('📊', 'Estimation Report'));
    console.log(this.colorize('─', '─'.repeat(50)));
    console.log(`Total Tasks: ${report.summary.totalTasks}`);
    console.log(`Tasks with Estimates: ${report.summary.tasksWithEstimates}`);
    console.log(`Estimation Coverage: ${report.summary.estimationCoverage.toFixed(1)}%`);
    console.log(`Time Accuracy: ${report.summary.timeAccuracy.toFixed(1)}%`);
    console.log(`Time Bias: ${report.summary.timeBias > 0 ? '+' : ''}${report.summary.timeBias.toFixed(1)}%`);
    console.log(`Estimation Quality: ${this.colorizeQuality(report.summary.estimationQuality)}`);
    
    if (report.summary.recommendations.length > 0) {
      console.log();
      console.log(this.colorize('💡', 'Recommendations'));
      report.summary.recommendations.forEach((rec: string) => {
        console.log(`• ${rec}`);
      });
    }
  }

  public static async confirm(message: string): Promise<boolean> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${message} (y/N): `, (answer: string) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  public static progress(message: string): void {
    if (!this.quiet) {
      process.stdout.write(`\r${this.colorize(chalk.blue('⏳'), message)}`);
    }
  }

  public static clearProgress(): void {
    if (!this.quiet) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }
  }

  private static colorize(icon: string, message: string): string {
    if (this.noColor) {
      return `${icon} ${message}`;
    }
    return `${icon} ${message}`;
  }

  private static colorizeState(state: string): string {
    if (this.noColor) return state;
    
    switch (state) {
      case 'pending': return chalk.gray(state);
      case 'in-progress': return chalk.blue(state);
      case 'completed': return chalk.green(state);
      case 'blocked': return chalk.red(state);
      default: return state;
    }
  }

  private static colorizeSessionState(state: string): string {
    if (this.noColor) return state;
    
    switch (state) {
      case 'active': return chalk.green(state);
      case 'paused': return chalk.yellow(state);
      case 'stopped': return chalk.gray(state);
      default: return state;
    }
  }

  private static colorizeQuality(quality: string): string {
    if (this.noColor) return quality;
    
    switch (quality) {
      case 'excellent': return chalk.green(quality);
      case 'good': return chalk.blue(quality);
      case 'fair': return chalk.yellow(quality);
      case 'poor': return chalk.red(quality);
      default: return quality;
    }
  }

  private static getSessionState(session: TimeSession): string {
    if (session.stoppedAt) return 'stopped';
    if (session.pausedAt && !session.resumedAt) return 'paused';
    return 'active';
  }
}
