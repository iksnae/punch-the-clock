import { CreateTaskData, UpdateTaskData, TaskState } from '../types/Task';

export class TaskValidator {
  public static validateCreateData(data: CreateTaskData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.number || data.number.trim().length === 0) {
      errors.push('Task number is required');
    }

    if (data.number && data.number.length > 50) {
      errors.push('Task number must be 50 characters or less');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Task title is required');
    }

    if (data.title && data.title.length > 500) {
      errors.push('Task title must be 500 characters or less');
    }

    if (data.description && data.description.length > 65535) {
      errors.push('Task description must be 65535 characters or less');
    }

    const validStates: TaskState[] = ['pending', 'in-progress', 'completed', 'blocked'];
    if (data.state && !validStates.includes(data.state)) {
      errors.push('Invalid task state');
    }

    if (data.sizeEstimate !== undefined && data.sizeEstimate <= 0) {
      errors.push('Size estimate must be positive');
    }

    if (data.timeEstimateHours !== undefined && data.timeEstimateHours <= 0) {
      errors.push('Time estimate must be positive');
    }

    // Validate task number format (alphanumeric, hyphens, underscores)
    if (data.number && !/^[a-zA-Z0-9\-_]+$/.test(data.number)) {
      errors.push('Task number can only contain letters, numbers, hyphens, and underscores');
    }

    // Validate tags
    if (data.tags) {
      for (const tag of data.tags) {
        if (tag.length === 0 || tag.length > 100) {
          errors.push('Tag must be between 1 and 100 characters');
        }
        if (!/^[a-zA-Z0-9\-_]+$/.test(tag)) {
          errors.push('Tag can only contain letters, numbers, hyphens, and underscores');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static validateUpdateData(data: UpdateTaskData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.number !== undefined) {
      if (!data.number || data.number.trim().length === 0) {
        errors.push('Task number cannot be empty');
      }

      if (data.number && data.number.length > 50) {
        errors.push('Task number must be 50 characters or less');
      }

      // Validate task number format (alphanumeric, hyphens, underscores)
      if (data.number && !/^[a-zA-Z0-9\-_]+$/.test(data.number)) {
        errors.push('Task number can only contain letters, numbers, hyphens, and underscores');
      }
    }

    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('Task title cannot be empty');
      }

      if (data.title && data.title.length > 500) {
        errors.push('Task title must be 500 characters or less');
      }
    }

    if (data.description !== undefined) {
      if (data.description && data.description.length > 65535) {
        errors.push('Task description must be 65535 characters or less');
      }
    }

    if (data.state !== undefined) {
      const validStates: TaskState[] = ['pending', 'in-progress', 'completed', 'blocked'];
      if (!validStates.includes(data.state)) {
        errors.push('Invalid task state');
      }
    }

    if (data.sizeEstimate !== undefined) {
      if (data.sizeEstimate <= 0) {
        errors.push('Size estimate must be positive');
      }
    }

    if (data.timeEstimateHours !== undefined) {
      if (data.timeEstimateHours <= 0) {
        errors.push('Time estimate must be positive');
      }
    }

    if (data.tags !== undefined) {
      for (const tag of data.tags) {
        if (tag.length === 0 || tag.length > 100) {
          errors.push('Tag must be between 1 and 100 characters');
        }
        if (!/^[a-zA-Z0-9\-_]+$/.test(tag)) {
          errors.push('Tag can only contain letters, numbers, hyphens, and underscores');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static sanitizeNumber(number: string): string {
    return number.trim();
  }

  public static sanitizeTitle(title: string): string {
    return title.trim();
  }

  public static sanitizeDescription(description?: string): string | undefined {
    if (!description) return undefined;
    return description.trim();
  }

  public static sanitizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  }

  public static validateStateTransition(fromState: TaskState, toState: TaskState): { valid: boolean; reason?: string } {
    const validTransitions: Record<TaskState, TaskState[]> = {
      'pending': ['in-progress', 'completed', 'blocked'],
      'in-progress': ['pending', 'completed', 'blocked'],
      'completed': ['pending', 'in-progress'],
      'blocked': ['pending', 'in-progress'],
    };

    if (!validTransitions[fromState].includes(toState)) {
      return {
        valid: false,
        reason: `Cannot transition from ${fromState} to ${toState}`,
      };
    }

    return { valid: true };
  }
}
