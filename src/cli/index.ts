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
import { TimeCalculations } from '../utils/timeCalculations';

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

    // Initialize services in dependency order
    const projectService = new ProjectService(projectRepo);
    const taskService = new TaskService(taskRepo, taskTagRepo);
    const timeTrackingService = new TimeTrackingService(timeSessionRepo);
    const reportingService = new ReportingService(timeTrackingService, taskService, projectService);

    this.services = {
      project: projectService,
      task: taskService,
      timeTracking: timeTrackingService,
      reporting: reportingService,
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


  // Command handlers
  private async handleProjectInit(name: string, options: any): Promise<void> {
    try {
      // Validate project name
      const validation = await this.services.project.validateProjectName(name);
      if (!validation.valid) {
        throw new CLIError(`Invalid project name: ${validation.errors.join(', ')}`);
      }

      // Check if project already exists
      const existingProject = await this.services.project.getProjectByName(name);
      if (existingProject && !options.force) {
        throw new CLIError(`Project "${name}" already exists. Use --force to overwrite.`);
      }

      if (existingProject && options.force) {
        await this.services.project.deleteProject(existingProject.id);
        OutputUtils.warning(`Overwrote existing project "${name}"`);
      }

      const project = await this.services.project.createProject(name, options.description);
      OutputUtils.success(`Project "${name}" created successfully`);
      OutputUtils.info(`Project ID: ${project.id}`);
      
      // Set as current project
      ConfigUtils.setCurrentProject(project);
      OutputUtils.info(`Set "${name}" as current project`);
    } catch (error) {
      throw new CLIError(`Failed to create project: ${error}`);
    }
  }

  private async handleProjectList(options: any): Promise<void> {
    try {
      const projects = await this.services.project.listProjects();
      if (projects.length === 0) {
        OutputUtils.info('No projects found. Create your first project with: ptc project init <name>');
        return;
      }
      
      OutputUtils.displayProjects(projects, options.format);
      
      // Show current project if set
      const currentProject = ConfigUtils.getCurrentProject();
      if (currentProject) {
        OutputUtils.info(`Current project: ${currentProject.name}`);
      }
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
      
      // Show project stats
      const stats = await this.services.project.getProjectStats(project.id);
      OutputUtils.info(`Tasks: ${stats.totalTasks} (${stats.completedTasks} completed)`);
      OutputUtils.info(`Total time: ${TimeCalculations.formatDuration(stats.totalTimeSpent)}`);
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
      
      // Show recent tasks
      const recentTasks = await this.services.task.getRecentTasks(project.id, 5);
      if (recentTasks.length > 0) {
        OutputUtils.info('\nRecent Tasks:');
        OutputUtils.displayTasks(recentTasks, 'table');
      }
      
      // Show active tasks
      const activeTasks = await this.services.task.getActiveTasks(project.id);
      if (activeTasks.length > 0) {
        OutputUtils.info('\nActive Tasks:');
        OutputUtils.displayTasks(activeTasks, 'table');
      }
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

      // Check if this is the current project
      const currentProject = ConfigUtils.getCurrentProject();
      if (currentProject && currentProject.id === project.id) {
        OutputUtils.warning(`Deleting current project "${name}"`);
        ConfigUtils.setCurrentProject(undefined as any);
      }

      // Show project stats before deletion
      const stats = await this.services.project.getProjectStats(project.id);
      OutputUtils.warning(`Project "${name}" has ${stats.totalTasks} tasks and ${TimeCalculations.formatDuration(stats.totalTimeSpent)} of tracked time`);

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

  // Task command handlers
  private async handleTaskAdd(title: string, options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Generate task number if not provided
      const taskNumber = options.number || await this.services.task.generateTaskNumber(currentProject.id);
      
      // Validate task number
      const numberValidation = await this.services.task.validateTaskNumber(currentProject.id, taskNumber);
      if (!numberValidation.valid) {
        throw new CLIError(`Invalid task number: ${numberValidation.errors.join(', ')}`);
      }

      const taskData = {
        projectId: currentProject.id,
        number: taskNumber,
        title,
        description: options.description,
        state: options.state || 'pending',
        sizeEstimate: options.size,
        timeEstimateHours: options.time,
        tags: options.tags ? options.tags.split(',').map((tag: string) => tag.trim()) : [],
      };

      const task = await this.services.task.createTask(currentProject.id, taskData);
      OutputUtils.success(`Task "${taskNumber}" created successfully`);
      OutputUtils.info(`Task ID: ${task.id}`);
      OutputUtils.info(`Title: ${task.title}`);
      
      if (task.description) {
        OutputUtils.info(`Description: ${task.description}`);
      }
      
      if (task.tags && task.tags.length > 0) {
        OutputUtils.info(`Tags: ${task.tags.join(', ')}`);
      }
    } catch (error) {
      throw new CLIError(`Failed to create task: ${error}`);
    }
  }

  private async handleTaskList(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      const filters: any = {};
      
      if (options.state) {
        filters.state = options.state;
      }
      
      if (options.tags) {
        filters.tags = options.tags.split(',').map((tag: string) => tag.trim());
      }
      
      if (options.search) {
        filters.search = options.search;
      }

      const tasks = await this.services.task.listTasks(currentProject.id, filters);
      
      if (tasks.length === 0) {
        OutputUtils.info('No tasks found. Create your first task with: ptc task add <title>');
        return;
      }
      
      OutputUtils.displayTasks(tasks, options.format);
      
      // Show summary
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.state === 'completed').length;
      const inProgressTasks = tasks.filter(task => task.state === 'in-progress').length;
      
      OutputUtils.info(`\nSummary: ${totalTasks} total, ${completedTasks} completed, ${inProgressTasks} in progress`);
    } catch (error) {
      throw new CLIError(`Failed to list tasks: ${error}`);
    }
  }

  private async handleTaskShow(id: string): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Try to find task by ID or number
      let task: any = null;
      
      if (/^\d+$/.test(id)) {
        // Numeric ID
        task = await this.services.task.getTask(parseInt(id));
      } else {
        // Task number
        task = await this.services.task.getTaskByNumber(currentProject.id, id);
      }
      
      if (!task) {
        throw new CLIError(`Task "${id}" not found`);
      }

      // Get task stats
      const stats = await this.services.task.getTaskStats(task.id);
      OutputUtils.displayTaskDetails(task, stats);
      
      // Show recent time sessions
      const recentSessions = await this.services.timeTracking.listSessions({ taskId: task.id });
      if (recentSessions.length > 0) {
        OutputUtils.info('\nRecent Time Sessions:');
        OutputUtils.displayTimeSessions(recentSessions.slice(0, 5), 'table');
      }
    } catch (error) {
      throw new CLIError(`Failed to show task: ${error}`);
    }
  }

  private async handleTaskUpdate(id: string, options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Try to find task by ID or number
      let task: any = null;
      
      if (/^\d+$/.test(id)) {
        // Numeric ID
        task = await this.services.task.getTask(parseInt(id));
      } else {
        // Task number
        task = await this.services.task.getTaskByNumber(currentProject.id, id);
      }
      
      if (!task) {
        throw new CLIError(`Task "${id}" not found`);
      }

      // Build update data
      const updateData: any = {};
      
      if (options.title) {
        updateData.title = options.title;
      }
      
      if (options.description !== undefined) {
        updateData.description = options.description;
      }
      
      if (options.state) {
        updateData.state = options.state;
      }
      
      if (options.size !== undefined) {
        updateData.sizeEstimate = options.size;
      }
      
      if (options.time !== undefined) {
        updateData.timeEstimateHours = options.time;
      }
      
      if (options.tags !== undefined) {
        updateData.tags = options.tags ? options.tags.split(',').map((tag: string) => tag.trim()) : [];
      }

      if (Object.keys(updateData).length === 0) {
        throw new CLIError('No updates specified. Use --title, --description, --state, --size, --time, or --tags');
      }

      const updatedTask = await this.services.task.updateTask(task.id, updateData);
      OutputUtils.success(`Task "${task.number}" updated successfully`);
      
      // Show updated task details
      const stats = await this.services.task.getTaskStats(updatedTask.id);
      OutputUtils.displayTaskDetails(updatedTask, stats);
    } catch (error) {
      throw new CLIError(`Failed to update task: ${error}`);
    }
  }

  private async handleTaskDelete(id: string, options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Try to find task by ID or number
      let task: any = null;
      
      if (/^\d+$/.test(id)) {
        // Numeric ID
        task = await this.services.task.getTask(parseInt(id));
      } else {
        // Task number
        task = await this.services.task.getTaskByNumber(currentProject.id, id);
      }
      
      if (!task) {
        throw new CLIError(`Task "${id}" not found`);
      }

      // Show task details before deletion
      const stats = await this.services.task.getTaskStats(task.id);
      OutputUtils.warning(`Task "${task.number}" has ${stats.sessionCount} time sessions and ${TimeCalculations.formatDuration(stats.totalTimeSpent)} of tracked time`);

      if (!options.force) {
        const confirmed = await OutputUtils.confirm(`Are you sure you want to delete task "${task.number}"?`);
        if (!confirmed) {
          OutputUtils.info('Task deletion cancelled');
          return;
        }
      }

      await this.services.task.deleteTask(task.id);
      OutputUtils.success(`Task "${task.number}" deleted successfully`);
    } catch (error) {
      throw new CLIError(`Failed to delete task: ${error}`);
    }
  }

  private async handleTimeStart(taskId: string, options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Try to find task by ID or number
      let task: any = null;
      
      if (/^\d+$/.test(taskId)) {
        // Numeric ID
        task = await this.services.task.getTask(parseInt(taskId));
      } else {
        // Task number
        task = await this.services.task.getTaskByNumber(currentProject.id, taskId);
      }
      
      if (!task) {
        throw new CLIError(`Task "${taskId}" not found`);
      }

      // Check if there's already an active session
      const activeSession = await this.services.timeTracking.getActiveSession();
      if (activeSession) {
        throw new CLIError(`Task "${task.number}" already has an active time session (ID: ${activeSession.id}). Stop it first.`);
      }

      // Start time tracking
      const session = await this.services.timeTracking.startTracking(task.id);

      OutputUtils.success(`Started time tracking for task "${task.number}"`);
      OutputUtils.info(`Session ID: ${session.id}`);
      OutputUtils.info(`Task: ${task.title}`);
      
      
      OutputUtils.info(`Started at: ${TimeCalculations.getDateString(session.startedAt)} ${TimeCalculations.getTimeOfDay(session.startedAt)}`);
    } catch (error) {
      throw new CLIError(`Failed to start time tracking: ${error}`);
    }
  }

  private async handleTimePause(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Find active session
      let activeSession: any = null;
      
      if (options.sessionId) {
        // Pause specific session
        activeSession = await this.services.timeTracking.getActiveSession();
      } else {
        // Find any active session in current project
        const tasks = await this.services.task.listTasks(currentProject.id);
        for (const task of tasks) {
          const session = await this.services.timeTracking.getActiveSession();
          if (session) {
            activeSession = session;
            break;
          }
        }
      }
      
      if (!activeSession) {
        throw new CLIError('No active time session found to pause');
      }

      // Pause the session
      const pausedSession = await this.services.timeTracking.pauseTracking(activeSession.id);
      
      OutputUtils.success(`Paused time session ${activeSession.id}`);
      OutputUtils.info(`Duration so far: ${TimeCalculations.formatDuration(pausedSession.durationSeconds)}`);
      OutputUtils.info(`Paused at: ${TimeCalculations.getDateString(pausedSession.pausedAt!)} ${TimeCalculations.getTimeOfDay(pausedSession.pausedAt!)}`);
    } catch (error) {
      throw new CLIError(`Failed to pause time tracking: ${error}`);
    }
  }

  private async handleTimeResume(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Find paused session
      let pausedSession: any = null;
      
      if (options.sessionId) {
        // Resume specific session
        const session = await this.services.timeTracking.getActiveSession();
        if (session && TimeCalculations.getSessionStatus(session) === 'paused') {
          pausedSession = session;
        }
      } else {
        // Find any paused session in current project
        const pausedSessions = await this.services.timeTracking.getPausedSessions();
        const tasks = await this.services.task.listTasks(currentProject.id);
        const taskIds = tasks.map(task => task.id);
        
        for (const session of pausedSessions) {
          if (taskIds.includes(session.taskId)) {
            pausedSession = session;
            break;
          }
        }
      }
      
      if (!pausedSession) {
        throw new CLIError('No paused time session found to resume');
      }

      // Resume the session
      const resumedSession = await this.services.timeTracking.resumeTracking(pausedSession.id);
      
      OutputUtils.success(`Resumed time session ${pausedSession.id}`);
      OutputUtils.info(`Duration so far: ${TimeCalculations.formatDuration(resumedSession.durationSeconds)}`);
      OutputUtils.info(`Resumed at: ${TimeCalculations.getDateString(resumedSession.resumedAt!)} ${TimeCalculations.getTimeOfDay(resumedSession.resumedAt!)}`);
    } catch (error) {
      throw new CLIError(`Failed to resume time tracking: ${error}`);
    }
  }

  private async handleTimeStop(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Find active session
      let activeSession: any = null;
      
      if (options.sessionId) {
        // Stop specific session
        activeSession = await this.services.timeTracking.getActiveSession();
      } else {
        // Find any active or paused session in current project
        const tasks = await this.services.task.listTasks(currentProject.id);
        const taskIds = tasks.map(task => task.id);
        
        // Check for active sessions
        const activeSessionCheck = await this.services.timeTracking.getActiveSession();
        if (activeSessionCheck && taskIds.includes(activeSessionCheck.taskId)) {
          activeSession = activeSessionCheck;
        } else {
          // Check for paused sessions
          const pausedSessions = await this.services.timeTracking.getPausedSessions();
          for (const session of pausedSessions) {
            if (taskIds.includes(session.taskId)) {
              activeSession = session;
              break;
            }
          }
        }
      }
      
      if (!activeSession) {
        throw new CLIError('No active time session found to stop');
      }

      // Stop the session
      const stoppedSession = await this.services.timeTracking.stopTracking(activeSession.id);
      
      OutputUtils.success(`Stopped time session ${activeSession.id}`);
      OutputUtils.info(`Total duration: ${TimeCalculations.formatDuration(stoppedSession.durationSeconds)}`);
      OutputUtils.info(`Stopped at: ${TimeCalculations.getDateString(stoppedSession.stoppedAt!)} ${TimeCalculations.getTimeOfDay(stoppedSession.stoppedAt!)}`);
      
      // Show task info
      const task = await this.services.task.getTask(stoppedSession.taskId);
      if (task) {
        OutputUtils.info(`Task: ${task.number} - ${task.title}`);
      }
    } catch (error) {
      throw new CLIError(`Failed to stop time tracking: ${error}`);
    }
  }

  private async handleTimeStatus(): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Find all active sessions in current project
      const tasks = await this.services.task.listTasks(currentProject.id);
      const activeSessions: any[] = [];
      
      // Check for active sessions
      const activeSession = await this.services.timeTracking.getActiveSession();
      if (activeSession) {
        const task = await this.services.task.getTask(activeSession.taskId);
        if (task && task.projectId === currentProject.id) {
          activeSessions.push({ session: activeSession, task });
        }
      }
      
      // Check for paused sessions
      const pausedSessions = await this.services.timeTracking.getPausedSessions();
      for (const session of pausedSessions) {
        const task = await this.services.task.getTask(session.taskId);
        if (task && task.projectId === currentProject.id) {
          activeSessions.push({ session, task });
        }
      }
      
      if (activeSessions.length === 0) {
        OutputUtils.info('No active time sessions');
        return;
      }
      
      OutputUtils.info(`Active time sessions (${activeSessions.length}):`);
      
      for (const { session, task } of activeSessions) {
        const duration = TimeCalculations.formatDuration(session.durationSeconds);
        const status = TimeCalculations.getSessionStatus(session) === 'active' ? '🟢 Active' : '🟡 Paused';
        
        OutputUtils.info(`\n${status} - Session ${session.id}`);
        OutputUtils.info(`Task: ${task.number} - ${task.title}`);
        OutputUtils.info(`Duration: ${duration}`);
        OutputUtils.info(`Started: ${TimeCalculations.getDateString(session.startedAt)} ${TimeCalculations.getTimeOfDay(session.startedAt)}`);
        
        if (TimeCalculations.getSessionStatus(session) === 'paused' && session.pausedAt) {
          OutputUtils.info(`Paused: ${TimeCalculations.getDateString(session.pausedAt)} ${TimeCalculations.getTimeOfDay(session.pausedAt)}`);
        }
      }
    } catch (error) {
      throw new CLIError(`Failed to show time status: ${error}`);
    }
  }

  private async handleReportTime(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Build filters
      const filters: any = {
        projectId: currentProject.id,
      };
      
      if (options.taskId) {
        filters.taskId = parseInt(options.taskId);
      }
      
      if (options.tags) {
        filters.tags = options.tags.split(',').map((tag: string) => tag.trim());
      }
      
      if (options.from) {
        filters.from = new Date(options.from);
      }
      
      if (options.to) {
        filters.to = new Date(options.to);
      }

      // Generate time report
      const report = await this.services.reporting.getTimeReport(filters);
      
      OutputUtils.displayTimeReport(report);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      }
    } catch (error) {
      throw new CLIError(`Failed to generate time report: ${error}`);
    }
  }

  private async handleReportVelocity(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Build filters
      const filters: any = {
        projectId: currentProject.id,
      };
      
      if (options.period) {
        filters.period = options.period;
      }
      
      if (options.from) {
        filters.from = new Date(options.from);
      }
      
      if (options.to) {
        filters.to = new Date(options.to);
      }

      // Generate velocity report
      const report = await this.services.reporting.getVelocityReport(filters);
      
      OutputUtils.displayVelocityReport(report);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      }
    } catch (error) {
      throw new CLIError(`Failed to generate velocity report: ${error}`);
    }
  }

  private async handleReportEstimates(options: any): Promise<void> {
    try {
      const currentProject = ConfigUtils.getCurrentProject();
      if (!currentProject) {
        throw new CLIError('No current project set. Use "ptc project switch <name>" to set a project');
      }

      // Build filters
      const filters: any = {
        projectId: currentProject.id,
      };
      
      if (options.from) {
        filters.from = new Date(options.from);
      }
      
      if (options.to) {
        filters.to = new Date(options.to);
      }

      // Generate estimation report
      const report = await this.services.reporting.getEstimationReport(filters);
      
      OutputUtils.displayEstimationReport(report);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      }
    } catch (error) {
      throw new CLIError(`Failed to generate estimation report: ${error}`);
    }
  }

  private async handleConfigShow(): Promise<void> {
    try {
      const config = ConfigUtils.getConfig();
      const currentProject = ConfigUtils.getCurrentProject();
      
      OutputUtils.info('Current Configuration:');
      if (config.database) {
        OutputUtils.info(`Database Host: ${config.database.host}`);
        OutputUtils.info(`Database Port: ${config.database.port}`);
        OutputUtils.info(`Database Name: ${config.database.database}`);
        OutputUtils.info(`Database User: ${config.database.user}`);
        OutputUtils.info(`Database SSL: ${config.database.ssl ? 'Enabled' : 'Disabled'}`);
        OutputUtils.info(`Connection Limit: ${config.database.connectionLimit || 'Default'}`);
        OutputUtils.info(`Acquire Timeout: ${config.database.acquireTimeout || 'Default'}ms`);
        OutputUtils.info(`Query Timeout: ${config.database.timeout || 'Default'}ms`);
      } else {
        OutputUtils.info('Database configuration not set');
      }
      
      if (currentProject) {
        OutputUtils.info(`\nCurrent Project: ${currentProject.name} (ID: ${currentProject.id})`);
      } else {
        OutputUtils.info('\nNo current project set');
      }
    } catch (error) {
      throw new CLIError(`Failed to show configuration: ${error}`);
    }
  }

  private async handleConfigSet(key: string, value: string): Promise<void> {
    try {
      const validKeys = [
        'database.host',
        'database.port',
        'database.database',
        'database.user',
        'database.password',
        'database.ssl',
        'database.connectionLimit',
        'database.acquireTimeout',
        'database.timeout',
      ];
      
      if (!validKeys.includes(key)) {
        throw new CLIError(`Invalid configuration key: ${key}. Valid keys: ${validKeys.join(', ')}`);
      }
      
      // Parse value based on key
      let parsedValue: any = value;
      
      if (key === 'database.port' || key === 'database.connectionLimit' || key === 'database.acquireTimeout' || key === 'database.timeout') {
        parsedValue = parseInt(value);
        if (isNaN(parsedValue)) {
          throw new CLIError(`Invalid value for ${key}: must be a number`);
        }
      } else if (key === 'database.ssl') {
        parsedValue = value.toLowerCase() === 'true';
      }
      
      // Update configuration
      ConfigUtils.setConfigValue(key, parsedValue);
      OutputUtils.success(`Set ${key} = ${parsedValue}`);
      
      // Show updated configuration
      const config = ConfigUtils.getConfig();
      OutputUtils.info(`Updated configuration saved to ${ConfigUtils.getConfigPath()}`);
    } catch (error) {
      throw new CLIError(`Failed to set configuration: ${error}`);
    }
  }

  private async handleConfigReset(): Promise<void> {
    try {
      ConfigUtils.resetConfig();
      OutputUtils.success('Configuration reset to defaults');
      OutputUtils.info('Configuration file has been reset to default values');
    } catch (error) {
      throw new CLIError(`Failed to reset configuration: ${error}`);
    }
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
