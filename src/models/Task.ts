import { Task, CreateTaskData, UpdateTaskData, TaskState } from '../types/Task';

export class TaskModel {
  constructor(private data: Task) {}

  public getId(): number {
    return this.data.id;
  }

  public getProjectId(): number {
    return this.data.projectId;
  }

  public getNumber(): string {
    return this.data.number;
  }

  public getTitle(): string {
    return this.data.title;
  }

  public getDescription(): string | undefined {
    return this.data.description;
  }

  public getState(): TaskState {
    return this.data.state;
  }

  public getSizeEstimate(): number | undefined {
    return this.data.sizeEstimate;
  }

  public getTimeEstimateHours(): number | undefined {
    return this.data.timeEstimateHours;
  }

  public getTags(): string[] {
    return [...this.data.tags];
  }

  public getCreatedAt(): Date {
    return this.data.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.data.updatedAt;
  }

  public getData(): Task {
    return { ...this.data };
  }

  public update(updates: UpdateTaskData): void {
    if (updates.number !== undefined) {
      this.data.number = updates.number;
    }
    if (updates.title !== undefined) {
      this.data.title = updates.title;
    }
    if (updates.description !== undefined) {
      this.data.description = updates.description;
    }
    if (updates.state !== undefined) {
      this.data.state = updates.state;
    }
    if (updates.sizeEstimate !== undefined) {
      this.data.sizeEstimate = updates.sizeEstimate;
    }
    if (updates.timeEstimateHours !== undefined) {
      this.data.timeEstimateHours = updates.timeEstimateHours;
    }
    if (updates.tags !== undefined) {
      this.data.tags = [...updates.tags];
    }
    this.data.updatedAt = new Date();
  }

  public addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!this.data.tags.includes(normalizedTag)) {
      this.data.tags.push(normalizedTag);
      this.data.updatedAt = new Date();
    }
  }

  public removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    this.data.tags = this.data.tags.filter(t => t !== normalizedTag);
    this.data.updatedAt = new Date();
  }

  public hasTag(tag: string): boolean {
    const normalizedTag = tag.trim().toLowerCase();
    return this.data.tags.includes(normalizedTag);
  }

  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.data.number || this.data.number.trim().length === 0) {
      errors.push('Task number is required');
    }

    if (this.data.number && this.data.number.length > 50) {
      errors.push('Task number must be 50 characters or less');
    }

    if (!this.data.title || this.data.title.trim().length === 0) {
      errors.push('Task title is required');
    }

    if (this.data.title && this.data.title.length > 500) {
      errors.push('Task title must be 500 characters or less');
    }

    if (this.data.description && this.data.description.length > 65535) {
      errors.push('Task description must be 65535 characters or less');
    }

    const validStates: TaskState[] = ['pending', 'in-progress', 'completed', 'blocked'];
    if (!validStates.includes(this.data.state)) {
      errors.push('Invalid task state');
    }

    if (this.data.sizeEstimate !== undefined && this.data.sizeEstimate <= 0) {
      errors.push('Size estimate must be positive');
    }

    if (this.data.timeEstimateHours !== undefined && this.data.timeEstimateHours <= 0) {
      errors.push('Time estimate must be positive');
    }

    // Validate task number format (alphanumeric, hyphens, underscores)
    if (this.data.number && !/^[a-zA-Z0-9\-_]+$/.test(this.data.number)) {
      errors.push('Task number can only contain letters, numbers, hyphens, and underscores');
    }

    // Validate tags
    for (const tag of this.data.tags) {
      if (tag.length === 0 || tag.length > 100) {
        errors.push('Tag must be between 1 and 100 characters');
      }
      if (!/^[a-zA-Z0-9\-_]+$/.test(tag)) {
        errors.push('Tag can only contain letters, numbers, hyphens, and underscores');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static create(data: CreateTaskData): TaskModel {
    const now = new Date();
    const task: Task = {
      id: 0, // Will be set by database
      projectId: data.projectId,
      number: data.number.trim(),
      title: data.title.trim(),
      description: data.description?.trim(),
      state: data.state || 'pending',
      sizeEstimate: data.sizeEstimate,
      timeEstimateHours: data.timeEstimateHours,
      tags: (data.tags || []).map(tag => tag.trim().toLowerCase()),
      createdAt: now,
      updatedAt: now,
    };

    return new TaskModel(task);
  }

  public static fromDatabaseRow(row: any, tags: string[] = []): TaskModel {
    const task: Task = {
      id: row.id,
      projectId: row.project_id,
      number: row.number,
      title: row.title,
      description: row.description,
      state: row.state,
      sizeEstimate: row.size_estimate,
      timeEstimateHours: row.time_estimate_hours,
      tags: tags,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return new TaskModel(task);
  }

  public toDatabaseRow(): any {
    return {
      id: this.data.id,
      project_id: this.data.projectId,
      number: this.data.number,
      title: this.data.title,
      description: this.data.description,
      state: this.data.state,
      size_estimate: this.data.sizeEstimate,
      time_estimate_hours: this.data.timeEstimateHours,
      created_at: this.data.createdAt,
      updated_at: this.data.updatedAt,
    };
  }

  public toJSON(): Task {
    return this.getData();
  }
}
