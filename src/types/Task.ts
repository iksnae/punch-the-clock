// Task data types and interfaces

export type TaskState = 'pending' | 'in-progress' | 'completed' | 'blocked';

export interface Task {
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

export interface CreateTaskData {
  projectId: number;
  number: string;
  title: string;
  description?: string;
  state?: TaskState;
  sizeEstimate?: number;
  timeEstimateHours?: number;
  tags?: string[];
}

export interface UpdateTaskData {
  number?: string;
  title?: string;
  description?: string;
  state?: TaskState;
  sizeEstimate?: number;
  timeEstimateHours?: number;
  tags?: string[];
}

export interface TaskFilters {
  projectId?: number;
  state?: TaskState;
  tags?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}

export interface TaskStats {
  id: number;
  number: string;
  title: string;
  state: TaskState;
  totalTimeSpent: number; // in seconds
  sessionCount: number;
  averageSessionTime: number; // in seconds
  lastActivity?: Date;
  estimationAccuracy?: {
    sizeEstimate?: number;
    actualSize?: number;
    timeEstimate?: number;
    actualTime?: number;
    sizeAccuracy?: number; // percentage
    timeAccuracy?: number; // percentage
  };
}

export interface TaskWithProject extends Task {
  project: {
    id: number;
    name: string;
  };
}
