export class CLIError extends Error {
  public readonly code: string;
  public readonly exitCode: number;

  constructor(message: string, code: string = 'CLI_ERROR', exitCode: number = 1) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

export class DatabaseError extends CLIError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 2);
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 3);
  }
}

export class ProjectNotFoundError extends CLIError {
  constructor(projectName: string) {
    super(`Project "${projectName}" not found`, 'PROJECT_NOT_FOUND', 4);
  }
}

export class TaskNotFoundError extends CLIError {
  constructor(taskId: string) {
    super(`Task "${taskId}" not found`, 'TASK_NOT_FOUND', 5);
  }
}

export class TimeTrackingError extends CLIError {
  constructor(message: string) {
    super(message, 'TIME_TRACKING_ERROR', 6);
  }
}

export class ConfigurationError extends CLIError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 7);
  }
}
