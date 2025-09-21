# PTC API Documentation

## Overview

PTC (Punch the Clock) provides a comprehensive API for time tracking, project management, and velocity analytics. This document describes the internal API used by the CLI commands.

## Database Service Contracts

### ProjectService

#### `createProject(name: string, description?: string): Promise<Project>`
Creates a new project with the specified name and optional description.

**Parameters:**
- `name` (string): Project name (required, unique)
- `description` (string, optional): Project description

**Returns:** Promise<Project> - Project object with generated ID

**Throws:** `DuplicateProjectError` if name already exists

**Example:**
```typescript
const project = await projectService.createProject('my-project', 'A sample project');
console.log(project.id); // 1
console.log(project.name); // 'my-project'
```

#### `getProject(id: number): Promise<Project | null>`
Retrieves a project by its ID.

**Parameters:**
- `id` (number): Project ID

**Returns:** Promise<Project | null> - Project object or null if not found

**Example:**
```typescript
const project = await projectService.getProject(1);
if (project) {
  console.log(project.name);
}
```

#### `getProjectByName(name: string): Promise<Project | null>`
Retrieves a project by its name.

**Parameters:**
- `name` (string): Project name

**Returns:** Promise<Project | null> - Project object or null if not found

#### `listProjects(filters?: ProjectFilters): Promise<Project[]>`
Lists all projects with optional filtering.

**Parameters:**
- `filters` (ProjectFilters, optional): Filter criteria

**Returns:** Promise<Project[]> - Array of project objects

#### `updateProject(id: number, updates: UpdateProjectData): Promise<Project>`
Updates project properties.

**Parameters:**
- `id` (number): Project ID
- `updates` (UpdateProjectData): Partial project object with fields to update

**Returns:** Promise<Project> - Updated project object

**Throws:** `ProjectNotFoundError` if project doesn't exist

#### `deleteProject(id: number): Promise<void>`
Deletes a project and all associated data.

**Parameters:**
- `id` (number): Project ID

**Throws:** `ProjectNotFoundError` if project doesn't exist

### TaskService

#### `createTask(projectId: number, taskData: CreateTaskData): Promise<Task>`
Creates a new task in the specified project.

**Parameters:**
- `projectId` (number): Parent project ID
- `taskData` (CreateTaskData): Task creation data

**Returns:** Promise<Task> - Task object with generated ID

**Throws:** `ProjectNotFoundError` if project doesn't exist

**Example:**
```typescript
const task = await taskService.createTask(1, {
  number: 'TASK-001',
  title: 'Implement feature',
  description: 'Add new functionality',
  state: 'pending',
  sizeEstimate: 5,
  timeEstimateHours: 8,
  tags: ['frontend', 'urgent']
});
```

#### `getTask(id: number): Promise<Task | null>`
Retrieves a task by its ID.

**Parameters:**
- `id` (number): Task ID

**Returns:** Promise<Task | null> - Task object or null if not found

#### `getTaskByNumber(projectId: number, number: string): Promise<Task | null>`
Retrieves a task by its number within a project.

**Parameters:**
- `projectId` (number): Project ID
- `number` (string): Task number

**Returns:** Promise<Task | null> - Task object or null if not found

#### `listTasks(projectId: number, filters?: TaskFilters): Promise<Task[]>`
Lists tasks in a project with optional filtering.

**Parameters:**
- `projectId` (number): Project ID
- `filters` (TaskFilters, optional): Filter criteria

**Returns:** Promise<Task[]> - Array of task objects

#### `updateTask(id: number, updates: UpdateTaskData): Promise<Task>`
Updates task properties.

**Parameters:**
- `id` (number): Task ID
- `updates` (UpdateTaskData): Partial task object with fields to update

**Returns:** Promise<Task> - Updated task object

**Throws:** `TaskNotFoundError` if task doesn't exist

#### `deleteTask(id: number): Promise<void>`
Deletes a task and all associated data.

**Parameters:**
- `id` (number): Task ID

**Throws:** `TaskNotFoundError` if task doesn't exist

### TimeTrackingService

#### `startTracking(taskId: number, startTime?: Date): Promise<TimeSession>`
Starts time tracking for a task.

**Parameters:**
- `taskId` (number): Task ID to track
- `startTime` (Date, optional): Start time (default: now)

**Returns:** Promise<TimeSession> - Time session object

**Throws:** `TaskNotFoundError`, `ActiveSessionError` if already tracking

**Example:**
```typescript
const session = await timeTrackingService.startTracking(1);
console.log(session.id); // Session ID
console.log(session.startedAt); // Start timestamp
```

#### `pauseTracking(sessionId: number, pauseTime?: Date): Promise<TimeSession>`
Pauses active time tracking.

**Parameters:**
- `sessionId` (number): Active session ID
- `pauseTime` (Date, optional): Pause time (default: now)

**Returns:** Promise<TimeSession> - Updated time session object

**Throws:** `SessionNotFoundError`, `InvalidSessionStateError`

#### `resumeTracking(sessionId: number, resumeTime?: Date): Promise<TimeSession>`
Resumes paused time tracking.

**Parameters:**
- `sessionId` (number): Paused session ID
- `resumeTime` (Date, optional): Resume time (default: now)

**Returns:** Promise<TimeSession> - Updated time session object

**Throws:** `SessionNotFoundError`, `InvalidSessionStateError`

#### `stopTracking(sessionId: number, stopTime?: Date): Promise<TimeSession>`
Stops time tracking and calculates final duration.

**Parameters:**
- `sessionId` (number): Active session ID
- `stopTime` (Date, optional): Stop time (default: now)

**Returns:** Promise<TimeSession> - Completed time session object

**Throws:** `SessionNotFoundError`, `InvalidSessionStateError`

#### `getActiveSession(): Promise<TimeSession | null>`
Gets the currently active time session.

**Returns:** Promise<TimeSession | null> - Active session object or null

#### `getSessionsByTask(taskId: number): Promise<TimeSession[]>`
Gets all time sessions for a specific task.

**Parameters:**
- `taskId` (number): Task ID

**Returns:** Promise<TimeSession[]> - Array of time session objects

### ReportingService

#### `getTimeReport(filters: TimeReportFilters): Promise<TimeReport>`
Generates a time tracking report with aggregated data.

**Parameters:**
- `filters` (TimeReportFilters): Report filters (date range, project, task, tags)

**Returns:** Promise<TimeReport> - Time report with aggregated data

**Example:**
```typescript
const report = await reportingService.getTimeReport({
  projectId: 1,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  groupBy: 'task'
});
console.log(report.summary.totalTime); // Total time in seconds
```

#### `getVelocityReport(filters: VelocityReportFilters): Promise<VelocityReport>`
Generates a velocity report with metrics.

**Parameters:**
- `filters` (VelocityReportFilters): Report filters (date range, project, period)

**Returns:** Promise<VelocityReport> - Velocity report with metrics

#### `getEstimationReport(filters: EstimationReportFilters): Promise<EstimationReport>`
Generates an estimation accuracy report.

**Parameters:**
- `filters` (EstimationReportFilters): Report filters (date range, project)

**Returns:** Promise<EstimationReport> - Estimation accuracy report

## Data Models

### Project
```typescript
interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Task
```typescript
interface Task {
  id: number;
  projectId: number;
  number: string;
  title: string;
  description?: string;
  state: TaskState;
  sizeEstimate?: number;
  timeEstimateHours?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type TaskState = 'pending' | 'in-progress' | 'completed' | 'blocked';
```

### TimeSession
```typescript
interface TimeSession {
  id: number;
  taskId: number;
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  stoppedAt?: Date;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### CreateTaskData
```typescript
interface CreateTaskData {
  number: string;
  title: string;
  description?: string;
  state?: TaskState;
  sizeEstimate?: number;
  timeEstimateHours?: number;
  tags?: string[];
}
```

### TaskFilters
```typescript
interface TaskFilters {
  state?: TaskState;
  tags?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}
```

### TimeReportFilters
```typescript
interface TimeReportFilters {
  projectId?: number;
  taskId?: number;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'project' | 'task' | 'tags';
}
```

### VelocityReportFilters
```typescript
interface VelocityReportFilters {
  projectId?: number;
  startDate?: Date;
  endDate?: Date;
  period: 'week' | 'month';
}
```

### EstimationReportFilters
```typescript
interface EstimationReportFilters {
  projectId?: number;
  startDate?: Date;
  endDate?: Date;
}
```

## Error Types

### Custom Errors
```typescript
class DuplicateProjectError extends Error {
  constructor(projectName: string) {
    super(`Project '${projectName}' already exists`);
    this.name = 'DuplicateProjectError';
  }
}

class ProjectNotFoundError extends Error {
  constructor(projectId: number) {
    super(`Project with ID ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

class TaskNotFoundError extends Error {
  constructor(taskId: number) {
    super(`Task with ID ${taskId} not found`);
    this.name = 'TaskNotFoundError';
  }
}

class ActiveSessionError extends Error {
  constructor() {
    super('Another time session is already active');
    this.name = 'ActiveSessionError';
  }
}

class SessionNotFoundError extends Error {
  constructor(sessionId: number) {
    super(`Time session with ID ${sessionId} not found`);
    this.name = 'SessionNotFoundError';
  }
}

class InvalidSessionStateError extends Error {
  constructor(currentState: string, expectedState: string) {
    super(`Invalid session state: ${currentState}, expected: ${expectedState}`);
    this.name = 'InvalidSessionStateError';
  }
}
```

## Database Connection

### DatabaseService
```typescript
interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  executeQuery<T>(sql: string, params?: any[]): Promise<T[]>;
  executeTransaction<T>(operations: () => Promise<T>): Promise<T>;
  migrate(): Promise<void>;
}
```

### Connection Configuration
```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
}
```

## Performance Considerations

### Response Time Requirements
- **Simple queries**: < 10ms
- **Complex reports**: < 500ms
- **Database operations**: < 100ms
- **CLI command execution**: < 100ms total

### Concurrency Requirements
- **Connection pooling**: Support 10 concurrent connections
- **Transaction isolation**: READ COMMITTED level
- **Lock timeout**: 30 seconds maximum
- **Retry logic**: 3 attempts with exponential backoff

## Validation Rules

### Input Validation
- **Project names**: 1-255 characters, alphanumeric + spaces + hyphens
- **Task titles**: 1-500 characters, any printable characters
- **Task numbers**: 1-50 characters, alphanumeric + hyphens + underscores
- **Time estimates**: Positive numbers, max 999.99 hours
- **Size estimates**: Positive integers, max 999
- **Tags**: 1-100 characters, alphanumeric + hyphens + underscores

### Business Rules
- **Project names**: Must be unique
- **Task numbers**: Must be unique within a project
- **Time sessions**: Only one active session at a time
- **Estimates**: Cannot be negative or zero
- **States**: Must be valid enum values

## Usage Examples

### Basic Project and Task Management
```typescript
// Create a project
const project = await projectService.createProject('my-project', 'A sample project');

// Add a task
const task = await taskService.createTask(project.id, {
  number: 'TASK-001',
  title: 'Implement feature',
  description: 'Add new functionality',
  state: 'pending',
  sizeEstimate: 5,
  timeEstimateHours: 8,
  tags: ['frontend', 'urgent']
});

// Update task state
const updatedTask = await taskService.updateTask(task.id, {
  state: 'in-progress'
});
```

### Time Tracking
```typescript
// Start time tracking
const session = await timeTrackingService.startTracking(task.id);

// Pause tracking
const pausedSession = await timeTrackingService.pauseTracking(session.id);

// Resume tracking
const resumedSession = await timeTrackingService.resumeTracking(session.id);

// Stop tracking
const completedSession = await timeTrackingService.stopTracking(session.id);
console.log(`Total time: ${completedSession.durationSeconds} seconds`);
```

### Reporting
```typescript
// Generate time report
const timeReport = await reportingService.getTimeReport({
  projectId: project.id,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  groupBy: 'task'
});

// Generate velocity report
const velocityReport = await reportingService.getVelocityReport({
  projectId: project.id,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  period: 'week'
});

// Generate estimation report
const estimationReport = await reportingService.getEstimationReport({
  projectId: project.id,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});
```

## Best Practices

1. **Always handle errors**: Use try-catch blocks and handle specific error types
2. **Use transactions**: For operations that modify multiple related records
3. **Validate input**: Check data before passing to service methods
4. **Monitor performance**: Use performance monitoring for critical operations
5. **Handle concurrency**: Be aware of concurrent access to shared resources
6. **Clean up resources**: Always disconnect from database when done
7. **Use proper types**: Leverage TypeScript for type safety
8. **Test thoroughly**: Write comprehensive tests for all service methods
