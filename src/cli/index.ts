#!/usr/bin/env node

import { Command } from 'commander';
import { DatabaseConnection } from '../database/connection';
import { ProjectService } from '../services/ProjectService';
import { TaskService } from '../services/TaskService';
import { TimeTrackingService } from '../services/TimeTrackingService';
import { ReportingService } from '../services/ReportingService';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskTagRepository } from '../repositories/TaskTagRepository';
import { TimeSessionRepository } from '../repositories/TimeSessionRepository';
import { CLIError } from '../errors/CLIError';
import { HelpUtils } from './utils/help';
import { OutputUtils } from './utils/output';
import { ConfigUtils } from './utils/config';

export class PTCApplication {
  private program: Command;
  private db: DatabaseConnection;
  private services!: {
    project: ProjectService;
    task: TaskService;
    timeTracking: TimeTrackingService;
    reporting: ReportingService;
  };

  constructor() {
    this.program = new Command();
    this.db = new DatabaseConnection();
    this.initializeServices();
    this.setupCLI();
  }

  private initializeServices(): void {
    const projectRepo = new ProjectRepository(this.db);
    const taskRepo = new TaskRepository(this.db);
    const taskTagRepo = new TaskTagRepository(this.db);
    const timeSessionRepo = new TimeSessionRepository(this.db);

    this.services = {
      project: new ProjectService(projectRepo),
      task: new TaskService(taskRepo, taskTagRepo),
      timeTracking: new TimeTrackingService(timeSessionRepo),
      reporting: new ReportingService(
        new TimeTrackingService(timeSessionRepo),
        new TaskService(taskRepo, taskTagRepo),
        new ProjectService(projectRepo)
      ),
    };
  }

  private setupCLI(): void {
    this.program
      .name('ptc')
      .description('PTC - Punch the Clock: A task-based time tracking CLI for developers')
      .version('0.1.0')
      .option('-v, --verbose', 'Enable verbose output')
      .option('-q, --quiet', 'Suppress non-error output')
      .option('-c, --config <file>', 'Use custom config file')
      .option('--no-color', 'Disable colored output')
      .hook('preAction', this.preActionHook.bind(this))
      .hook('postAction', this.postActionHook.bind(this));

    // Global error handling
    this.program.configureOutput({
      writeErr: (str) => process.stderr.write(str),
      writeOut: (str) => process.stdout.write(str),
    });

    // Add command modules
    this.addProjectCommands();
    this.addTaskCommands();
    this.addTimeTrackingCommands();
    this.addReportingCommands();
    this.addConfigCommands();

    // Let Commander.js handle help automatically
  }

  private async preActionHook(thisCommand: Command, actionCommand: Command): Promise<void> {
    try {
      // Initialize database connection
      if (!this.db.isConnected()) {
        await this.db.connect();
        await this.db.migrate();
      }

      // Set global options
      const options = thisCommand.opts();
      ConfigUtils.setGlobalOptions(options);

      // Initialize output utilities
      OutputUtils.initialize(options);

    } catch (error) {
      throw new CLIError(`Failed to initialize application: ${error}`);
    }
  }

  private async postActionHook(thisCommand: Command, actionCommand: Command): Promise<void> {
    // Cleanup if needed
    if (this.db.isConnected()) {
      // Keep connection alive for subsequent commands
      // await this.db.disconnect();
    }
  }

  private addProjectCommands(): void {
    const projectCmd = this.program
      .command('project')
      .description('Project management commands');

    projectCmd
      .command('init <name>')
      .description('Create a new project')
      .option('-d, --description <text>', 'Project description')
      .option('--force', 'Overwrite existing project')
      .action(this.handleProjectInit.bind(this));

    projectCmd
      .command('list')
      .description('List all projects')
      .option('-f, --format <format>', 'Output format (table|json)', 'table')
      .action(this.handleProjectList.bind(this));

    projectCmd
      .command('switch <name>')
      .description('Switch to a project context')
      .action(this.handleProjectSwitch.bind(this));

    projectCmd
      .command('show <name>')
      .description('Show project details')
      .action(this.handleProjectShow.bind(this));

    projectCmd
      .command('delete <name>')
      .description('Delete a project')
      .option('--force', 'Force deletion without confirmation')
      .action(this.handleProjectDelete.bind(this));
  }

  private addTaskCommands(): void {
    const taskCmd = this.program
      .command('task')
      .description('Task management commands');

    taskCmd
      .command('add <title>')
      .description('Add a new task to the current project')
      .option('-d, --description <text>', 'Task description')
      .option('-e, --estimate <time>', 'Time estimate (e.g., "2h", "30m", "1d")')
      .option('-s, --size <number>', 'Size estimate in story points')
      .option('-t, --tags <tag1,tag2>', 'Comma-separated tags')
      .option('--state <state>', 'Initial state (pending|in-progress|completed|blocked)', 'pending')
      .action(this.handleTaskAdd.bind(this));

    taskCmd
      .command('list')
      .description('List tasks in the current project')
      .option('--state <state>', 'Filter by state')
      .option('--tags <tag>', 'Filter by tag')
      .option('-f, --format <format>', 'Output format (table|json)', 'table')
      .action(this.handleTaskList.bind(this));

    taskCmd
      .command('show <id>')
      .description('Show detailed information about a task')
      .action(this.handleTaskShow.bind(this));

    taskCmd
      .command('update <id>')
      .description('Update a task')
      .option('-t, --title <title>', 'Update title')
      .option('-d, --description <text>', 'Update description')
      .option('-e, --estimate <time>', 'Update time estimate')
      .option('-s, --size <number>', 'Update size estimate')
      .option('--state <state>', 'Update state')
      .option('--tags <tag1,tag2>', 'Update tags')
      .action(this.handleTaskUpdate.bind(this));

    taskCmd
      .command('delete <id>')
      .description('Delete a task')
      .option('--force', 'Force deletion without confirmation')
      .action(this.handleTaskDelete.bind(this));
  }

  private addTimeTrackingCommands(): void {
    const timeCmd = this.program
      .command('time')
      .description('Time tracking commands');

    timeCmd
      .command('start <task-id>')
      .description('Start time tracking for a task')
      .option('--at <time>', 'Start time (default: now)')
      .action(this.handleTimeStart.bind(this));

    timeCmd
      .command('pause')
      .description('Pause current time tracking')
      .option('--at <time>', 'Pause time (default: now)')
      .action(this.handleTimePause.bind(this));

    timeCmd
      .command('resume')
      .description('Resume paused time tracking')
      .option('--at <time>', 'Resume time (default: now)')
      .action(this.handleTimeResume.bind(this));

    timeCmd
      .command('stop')
      .description('Stop current time tracking')
      .option('--at <time>', 'Stop time (default: now)')
      .action(this.handleTimeStop.bind(this));

    timeCmd
      .command('status')
      .description('Show current time tracking status')
      .action(this.handleTimeStatus.bind(this));
  }

  private addReportingCommands(): void {
    const reportCmd = this.program
      .command('report')
      .description('Reporting commands');

    reportCmd
      .command('time')
      .description('Show time tracking reports')
      .option('--project <name>', 'Filter by project')
      .option('--task <id>', 'Filter by task')
      .option('--tags <tag>', 'Filter by tags')
      .option('--from <date>', 'Start date (YYYY-MM-DD)')
      .option('--to <date>', 'End date (YYYY-MM-DD)')
      .option('--by <field>', 'Group by field (project|task|tags)')
      .option('-f, --format <format>', 'Output format (table|json)', 'table')
      .action(this.handleReportTime.bind(this));

    reportCmd
      .command('velocity')
      .description('Show velocity metrics')
      .option('--project <name>', 'Filter by project')
      .option('--from <date>', 'Start date')
      .option('--to <date>', 'End date')
      .option('--period <period>', 'Time period for velocity calculation (week|month)', 'week')
      .action(this.handleReportVelocity.bind(this));

    reportCmd
      .command('estimates')
      .description('Show estimation accuracy reports')
      .option('--project <name>', 'Filter by project')
      .option('--from <date>', 'Start date')
      .option('--to <date>', 'End date')
      .action(this.handleReportEstimates.bind(this));
  }

  private addConfigCommands(): void {
    const configCmd = this.program
      .command('config')
      .description('Configuration commands');

    configCmd
      .command('show')
      .description('Show current configuration')
      .action(this.handleConfigShow.bind(this));

    configCmd
      .command('set <key> <value>')
      .description('Set configuration value')
      .action(this.handleConfigSet.bind(this));

    configCmd
      .command('reset')
      .description('Reset configuration to defaults')
      .action(this.handleConfigReset.bind(this));
  }


  // Command handlers (placeholder implementations)
  private async handleProjectInit(name: string, options: any): Promise<void> {
    try {
      const project = await this.services.project.createProject(name, options.description);
      OutputUtils.success(`Project "${name}" created successfully`);
      OutputUtils.info(`Project ID: ${project.id}`);
    } catch (error) {
      throw new CLIError(`Failed to create project: ${error}`);
    }
  }

  private async handleProjectList(options: any): Promise<void> {
    try {
      const projects = await this.services.project.listProjects();
      OutputUtils.displayProjects(projects, options.format);
    } catch (error) {
      throw new CLIError(`Failed to list projects: ${error}`);
    }
  }

  private async handleProjectSwitch(name: string): Promise<void> {
    try {
      const project = await this.services.project.getProjectByName(name);
      if (!project) {
        throw new CLIError(`Project "${name}" not found`);
      }
      ConfigUtils.setCurrentProject(project);
      OutputUtils.success(`Switched to project "${name}"`);
    } catch (error) {
      throw new CLIError(`Failed to switch project: ${error}`);
    }
  }

  private async handleProjectShow(name: string): Promise<void> {
    try {
      const project = await this.services.project.getProjectByName(name);
      if (!project) {
        throw new CLIError(`Project "${name}" not found`);
      }
      const stats = await this.services.project.getProjectStats(project.id);
      OutputUtils.displayProjectDetails(project, stats);
    } catch (error) {
      throw new CLIError(`Failed to show project: ${error}`);
    }
  }

  private async handleProjectDelete(name: string, options: any): Promise<void> {
    try {
      const project = await this.services.project.getProjectByName(name);
      if (!project) {
        throw new CLIError(`Project "${name}" not found`);
      }

      if (!options.force) {
        const confirmed = await OutputUtils.confirm(`Are you sure you want to delete project "${name}"?`);
        if (!confirmed) {
          OutputUtils.info('Project deletion cancelled');
          return;
        }
      }

      await this.services.project.deleteProject(project.id);
      OutputUtils.success(`Project "${name}" deleted successfully`);
    } catch (error) {
      throw new CLIError(`Failed to delete project: ${error}`);
    }
  }

  // Placeholder implementations for other command handlers
  private async handleTaskAdd(title: string, options: any): Promise<void> {
    OutputUtils.info(`Adding task: ${title}`);
  }

  private async handleTaskList(options: any): Promise<void> {
    OutputUtils.info('Listing tasks...');
  }

  private async handleTaskShow(id: string): Promise<void> {
    OutputUtils.info(`Showing task: ${id}`);
  }

  private async handleTaskUpdate(id: string, options: any): Promise<void> {
    OutputUtils.info(`Updating task: ${id}`);
  }

  private async handleTaskDelete(id: string, options: any): Promise<void> {
    OutputUtils.info(`Deleting task: ${id}`);
  }

  private async handleTimeStart(taskId: string, options: any): Promise<void> {
    OutputUtils.info(`Starting time tracking for task: ${taskId}`);
  }

  private async handleTimePause(options: any): Promise<void> {
    OutputUtils.info('Pausing time tracking...');
  }

  private async handleTimeResume(options: any): Promise<void> {
    OutputUtils.info('Resuming time tracking...');
  }

  private async handleTimeStop(options: any): Promise<void> {
    OutputUtils.info('Stopping time tracking...');
  }

  private async handleTimeStatus(): Promise<void> {
    OutputUtils.info('Showing time tracking status...');
  }

  private async handleReportTime(options: any): Promise<void> {
    OutputUtils.info('Generating time report...');
  }

  private async handleReportVelocity(options: any): Promise<void> {
    OutputUtils.info('Generating velocity report...');
  }

  private async handleReportEstimates(options: any): Promise<void> {
    OutputUtils.info('Generating estimation report...');
  }

  private async handleConfigShow(): Promise<void> {
    OutputUtils.info('Showing configuration...');
  }

  private async handleConfigSet(key: string, value: string): Promise<void> {
    OutputUtils.info(`Setting ${key} = ${value}`);
  }

  private async handleConfigReset(): Promise<void> {
    OutputUtils.info('Resetting configuration...');
  }

  public async run(): Promise<void> {
    try {
      await this.program.parseAsync();
    } catch (error) {
      if (error instanceof CLIError) {
        OutputUtils.error(error.message);
        process.exit(1);
      } else {
        OutputUtils.error(`Unexpected error: ${error}`);
        process.exit(1);
      }
    }
  }
}

// Main entry point
if (require.main === module) {
  const app = new PTCApplication();
  app.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
