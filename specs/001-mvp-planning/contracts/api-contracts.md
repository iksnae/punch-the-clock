# PTC API Contracts

## Database Service Contracts

### ProjectService

#### `createProject(name: string, description?: string): Promise<Project>`
**Purpose**: Create a new project
**Parameters**:
- `name`: Project name (required, unique)
- `description`: Project description (optional)

**Returns**: Project object with generated ID
**Throws**: `DuplicateProjectError` if name exists

#### `getProject(id: number): Promise<Project | null>`
**Purpose**: Get project by ID
**Parameters**:
- `id`: Project ID

**Returns**: Project object or null if not found

#### `getProjectByName(name: string): Promise<Project | null>`
**Purpose**: Get project by name
**Parameters**:
- `name`: Project name

**Returns**: Project object or null if not found

#### `listProjects(): Promise<Project[]>`
**Purpose**: List all projects
**Returns**: Array of project objects

#### `updateProject(id: number, updates: Partial<Project>): Promise<Project>`
**Purpose**: Update project properties
**Parameters**:
- `id`: Project ID
- `updates`: Partial project object with fields to update

**Returns**: Updated project object
**Throws**: `ProjectNotFoundError` if project doesn't exist

### TaskService

#### `createTask(projectId: number, taskData: CreateTaskData): Promise<Task>`
**Purpose**: Create a new task
**Parameters**:
- `projectId`: Parent project ID
- `taskData`: Task creation data

**Returns**: Task object with generated ID
**Throws**: `ProjectNotFoundError` if project doesn't exist

#### `getTask(id: number): Promise<Task | null>`
**Purpose**: Get task by ID
**Parameters**:
- `id`: Task ID

**Returns**: Task object or null if not found

#### `listTasks(projectId: number, filters?: TaskFilters): Promise<Task[]>`
**Purpose**: List tasks in a project
**Parameters**:
- `projectId`: Project ID
- `filters`: Optional filters (state, tags, etc.)

**Returns**: Array of task objects

#### `updateTask(id: number, updates: Partial<Task>): Promise<Task>`
**Purpose**: Update task properties
**Parameters**:
- `id`: Task ID
- `updates`: Partial task object with fields to update

**Returns**: Updated task object
**Throws**: `TaskNotFoundError` if task doesn't exist

### TimeTrackingService

#### `startTracking(taskId: number, startTime?: Date): Promise<TimeSession>`
**Purpose**: Start time tracking for a task
**Parameters**:
- `taskId`: Task ID to track
- `startTime`: Optional start time (default: now)

**Returns**: Time session object
**Throws**: `TaskNotFoundError`, `ActiveSessionError` if already tracking

#### `pauseTracking(sessionId: number, pauseTime?: Date): Promise<TimeSession>`
**Purpose**: Pause active time tracking
**Parameters**:
- `sessionId`: Active session ID
- `pauseTime`: Optional pause time (default: now)

**Returns**: Updated time session object
**Throws**: `SessionNotFoundError`, `InvalidSessionStateError`

#### `resumeTracking(sessionId: number, resumeTime?: Date): Promise<TimeSession>`
**Purpose**: Resume paused time tracking
**Parameters**:
- `sessionId`: Paused session ID
- `resumeTime`: Optional resume time (default: now)

**Returns**: Updated time session object
**Throws**: `SessionNotFoundError`, `InvalidSessionStateError`

#### `stopTracking(sessionId: number, stopTime?: Date): Promise<TimeSession>`
**Purpose**: Stop time tracking
**Parameters**:
- `sessionId`: Active session ID
- `stopTime`: Optional stop time (default: now)

**Returns**: Completed time session object
**Throws**: `SessionNotFoundError`, `InvalidSessionStateError`

#### `getActiveSession(): Promise<TimeSession | null>`
**Purpose**: Get currently active time session
**Returns**: Active session object or null

### ReportingService

#### `getTimeReport(filters: TimeReportFilters): Promise<TimeReport>`
**Purpose**: Generate time tracking report
**Parameters**:
- `filters`: Report filters (date range, project, task, tags)

**Returns**: Time report with aggregated data

#### `getVelocityReport(filters: VelocityReportFilters): Promise<VelocityReport>`
**Purpose**: Generate velocity report
**Parameters**:
- `filters`: Report filters (date range, project, period)

**Returns**: Velocity report with metrics

#### `getEstimationReport(filters: EstimationReportFilters): Promise<EstimationReport>`
**Purpose**: Generate estimation accuracy report
**Parameters**:
- `filters`: Report filters (date range, project)

**Returns**: Estimation accuracy report

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
}
```

### TimeReportFilters
```typescript
interface TimeReportFilters {
  projectId?: number;
  taskId?: number;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  groupBy?: 'project' | 'task' | 'tags';
}
```

### VelocityReportFilters
```typescript
interface VelocityReportFilters {
  projectId?: number;
  fromDate?: Date;
  toDate?: Date;
  period: 'week' | 'month';
}
```

### EstimationReportFilters
```typescript
interface EstimationReportFilters {
  projectId?: number;
  fromDate?: Date;
  toDate?: Date;
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

## Database Connection Contract

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

## Performance Contracts

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

## Validation Contracts

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
