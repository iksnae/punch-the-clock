import { CreateProjectData, UpdateProjectData } from '../types/Project';

export class ProjectValidator {
  public static validateCreateData(data: CreateProjectData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (data.name && data.name.length > 255) {
      errors.push('Project name must be 255 characters or less');
    }

    if (data.description && data.description.length > 65535) {
      errors.push('Project description must be 65535 characters or less');
    }

    // Validate name format (alphanumeric, spaces, hyphens, underscores)
    if (data.name && !/^[a-zA-Z0-9\s\-_]+$/.test(data.name)) {
      errors.push('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    // Check for reserved names
    const reservedNames = ['default', 'system', 'admin', 'root', 'test'];
    if (data.name && reservedNames.includes(data.name.toLowerCase())) {
      errors.push('Project name is reserved and cannot be used');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static validateUpdateData(data: UpdateProjectData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Project name cannot be empty');
      }

      if (data.name && data.name.length > 255) {
        errors.push('Project name must be 255 characters or less');
      }

      // Validate name format (alphanumeric, spaces, hyphens, underscores)
      if (data.name && !/^[a-zA-Z0-9\s\-_]+$/.test(data.name)) {
        errors.push('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
      }

      // Check for reserved names
      const reservedNames = ['default', 'system', 'admin', 'root', 'test'];
      if (data.name && reservedNames.includes(data.name.toLowerCase())) {
        errors.push('Project name is reserved and cannot be used');
      }
    }

    if (data.description !== undefined) {
      if (data.description && data.description.length > 65535) {
        errors.push('Project description must be 65535 characters or less');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static sanitizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  public static sanitizeDescription(description?: string): string | undefined {
    if (!description) return undefined;
    return description.trim();
  }
}
