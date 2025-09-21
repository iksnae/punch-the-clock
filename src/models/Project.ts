import { Project, CreateProjectData, UpdateProjectData } from '../types/Project';

export class ProjectModel {
  constructor(private data: Project) {}

  public getId(): number {
    return this.data.id;
  }

  public getName(): string {
    return this.data.name;
  }

  public getDescription(): string | undefined {
    return this.data.description;
  }

  public getCreatedAt(): Date {
    return this.data.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.data.updatedAt;
  }

  public getData(): Project {
    return { ...this.data };
  }

  public update(updates: UpdateProjectData): void {
    if (updates.name !== undefined) {
      this.data.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.data.description = updates.description;
    }
    this.data.updatedAt = new Date();
  }

  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.data.name || this.data.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (this.data.name && this.data.name.length > 255) {
      errors.push('Project name must be 255 characters or less');
    }

    if (this.data.description && this.data.description.length > 65535) {
      errors.push('Project description must be 65535 characters or less');
    }

    // Validate name format (alphanumeric, spaces, hyphens, underscores)
    if (this.data.name && !/^[a-zA-Z0-9\s\-_]+$/.test(this.data.name)) {
      errors.push('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static create(data: CreateProjectData): ProjectModel {
    const now = new Date();
    const project: Project = {
      id: 0, // Will be set by database
      name: data.name.trim(),
      description: data.description?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    return new ProjectModel(project);
  }

  public static fromDatabaseRow(row: any): ProjectModel {
    const project: Project = {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return new ProjectModel(project);
  }

  public toDatabaseRow(): any {
    return {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description,
      created_at: this.data.createdAt,
      updated_at: this.data.updatedAt,
    };
  }

  public toJSON(): Project {
    return this.getData();
  }
}
