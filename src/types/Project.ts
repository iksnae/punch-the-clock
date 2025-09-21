// Project data types and interfaces

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export interface ProjectFilters {
  name?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface ProjectStats {
  id: number;
  name: string;
  totalTasks: number;
  completedTasks: number;
  totalTimeSpent: number; // in seconds
  averageTaskTime: number; // in seconds
  lastActivity?: Date;
}
