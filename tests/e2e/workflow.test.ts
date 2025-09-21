import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('End-to-End Workflow Tests', () => {
  const cliPath = path.join(__dirname, '../../dist/cli.js');
  const testDbPath = path.join(__dirname, '../test-db.sqlite');

  beforeAll(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  const runCLI = (args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve) => {
      const child = spawn('node', [cliPath, ...args], {
        env: { ...process.env, PTC_DB_PATH: testDbPath },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });
    });
  };

  describe('Complete Development Workflow', () => {
    it('should handle complete project lifecycle', async () => {
      // 1. Initialize a new project
      let result = await runCLI(['project', 'init', 'E2E-Test-Project', '--description', 'End-to-end test project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project "E2E-Test-Project" created successfully');

      // 2. Switch to the project
      result = await runCLI(['project', 'switch', 'E2E-Test-Project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Switched to project "E2E-Test-Project"');

      // 3. Add multiple tasks with different properties
      result = await runCLI(['task', 'add', 'Setup Development Environment', '--description', 'Set up local development environment', '--tags', 'setup,dev']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-1" created successfully');

      result = await runCLI(['task', 'add', 'Implement User Authentication', '--description', 'Implement user login and registration', '--tags', 'auth,backend', '--estimate', '4h']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-2" created successfully');

      result = await runCLI(['task', 'add', 'Create Dashboard UI', '--description', 'Build the main dashboard interface', '--tags', 'frontend,ui', '--estimate', '6h']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-3" created successfully');

      // 4. List tasks to verify they were created
      result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Setup Development Environment');
      expect(result.stdout).toContain('Implement User Authentication');
      expect(result.stdout).toContain('Create Dashboard UI');

      // 5. Start time tracking on first task
      result = await runCLI(['time', 'start', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Started time tracking for task "TASK-1"');

      // 6. Check time status
      result = await runCLI(['time', 'status']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Active time sessions');

      // 7. Stop time tracking
      result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Stopped time session');

      // 8. Update task state
      result = await runCLI(['task', 'update', 'TASK-1', '--state', 'completed']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-1" updated successfully');

      // 9. Start time tracking on second task
      result = await runCLI(['time', 'start', 'TASK-2']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Started time tracking for task "TASK-2"');

      // 10. Pause time tracking
      result = await runCLI(['time', 'pause']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Paused time session');

      // 11. Resume time tracking
      result = await runCLI(['time', 'resume']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Resumed time session');

      // 12. Stop time tracking
      result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Stopped time session');

      // 13. Update task state
      result = await runCLI(['task', 'update', 'TASK-2', '--state', 'completed']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-2" updated successfully');

      // 14. Generate time report
      result = await runCLI(['report', 'time']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Time Report');

      // 15. Generate velocity report
      result = await runCLI(['report', 'velocity']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Velocity Report');

      // 16. Generate estimation report
      result = await runCLI(['report', 'estimates']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Estimation Report');

      // 17. Show project details
      result = await runCLI(['project', 'show', 'E2E-Test-Project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Details');
      expect(result.stdout).toContain('E2E-Test-Project');

      // 18. Clean up - delete the project
      result = await runCLI(['project', 'delete', 'E2E-Test-Project', '--force']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project "E2E-Test-Project" deleted successfully');
    });

    it('should handle multi-project workflow', async () => {
      // 1. Create multiple projects
      let result = await runCLI(['project', 'init', 'Frontend-Project', '--description', 'Frontend development project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'init', 'Backend-Project', '--description', 'Backend development project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'init', 'Mobile-Project', '--description', 'Mobile development project']);
      expect(result.exitCode).toBe(0);

      // 2. List all projects
      result = await runCLI(['project', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Frontend-Project');
      expect(result.stdout).toContain('Backend-Project');
      expect(result.stdout).toContain('Mobile-Project');

      // 3. Switch between projects and add tasks
      result = await runCLI(['project', 'switch', 'Frontend-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'React Component Development', '--tags', 'react,frontend']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Backend-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'API Development', '--tags', 'api,backend']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Mobile-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'Mobile App Development', '--tags', 'mobile,react-native']);
      expect(result.exitCode).toBe(0);

      // 4. Generate reports for each project
      result = await runCLI(['project', 'switch', 'Frontend-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['report', 'time']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Backend-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['report', 'velocity']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Mobile-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['report', 'estimates']);
      expect(result.exitCode).toBe(0);

      // 5. Clean up all projects
      result = await runCLI(['project', 'delete', 'Frontend-Project', '--force']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'delete', 'Backend-Project', '--force']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'delete', 'Mobile-Project', '--force']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle complex time tracking scenarios', async () => {
      // 1. Create project and tasks
      let result = await runCLI(['project', 'init', 'Time-Tracking-Test', '--description', 'Complex time tracking test']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Time-Tracking-Test']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'Complex Task 1', '--estimate', '2h']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'Complex Task 2', '--estimate', '3h']);
      expect(result.exitCode).toBe(0);

      // 2. Start time tracking on first task
      result = await runCLI(['time', 'start', 'TASK-1']);
      expect(result.exitCode).toBe(0);

      // 3. Pause and resume multiple times
      result = await runCLI(['time', 'pause']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['time', 'resume']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['time', 'pause']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['time', 'resume']);
      expect(result.exitCode).toBe(0);

      // 4. Stop time tracking
      result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(0);

      // 5. Start time tracking on second task
      result = await runCLI(['time', 'start', 'TASK-2']);
      expect(result.exitCode).toBe(0);

      // 6. Stop time tracking
      result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(0);

      // 7. Generate time report
      result = await runCLI(['report', 'time']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Time Report');

      // 8. Clean up
      result = await runCLI(['project', 'delete', 'Time-Tracking-Test', '--force']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle task management workflow', async () => {
      // 1. Create project
      let result = await runCLI(['project', 'init', 'Task-Management-Test', '--description', 'Task management test']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Task-Management-Test']);
      expect(result.exitCode).toBe(0);

      // 2. Add tasks with different properties
      result = await runCLI(['task', 'add', 'Task with Tags', '--tags', 'tag1,tag2,tag3']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'Task with Estimate', '--estimate', '5h']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'Task with Description', '--description', 'This is a detailed description']);
      expect(result.exitCode).toBe(0);

      // 3. List tasks
      result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task with Tags');
      expect(result.stdout).toContain('Task with Estimate');
      expect(result.stdout).toContain('Task with Description');

      // 4. Show individual task details
      result = await runCLI(['task', 'show', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task Details');

      // 5. Update tasks
      result = await runCLI(['task', 'update', 'TASK-1', '--title', 'Updated Task Title']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'update', 'TASK-2', '--state', 'in-progress']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'update', 'TASK-3', '--tags', 'newtag1,newtag2']);
      expect(result.exitCode).toBe(0);

      // 6. List tasks again to see changes
      result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);

      // 7. Delete a task
      result = await runCLI(['task', 'delete', 'TASK-3', '--force']);
      expect(result.exitCode).toBe(0);

      // 8. List tasks to confirm deletion
      result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);

      // 9. Clean up
      result = await runCLI(['project', 'delete', 'Task-Management-Test', '--force']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle configuration management', async () => {
      // 1. Show current configuration
      let result = await runCLI(['config', 'show']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Current Configuration');

      // 2. Set configuration values
      result = await runCLI(['config', 'set', 'database.host', 'localhost']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Set database.host = localhost');

      result = await runCLI(['config', 'set', 'database.port', '3306']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Set database.port = 3306');

      // 3. Show configuration again to see changes
      result = await runCLI(['config', 'show']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('localhost');
      expect(result.stdout).toContain('3306');

      // 4. Reset configuration
      result = await runCLI(['config', 'reset']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration reset to defaults');

      // 5. Show configuration to confirm reset
      result = await runCLI(['config', 'show']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle error scenarios gracefully', async () => {
      // 1. Try to create a project with invalid name
      let result = await runCLI(['project', 'init', '']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');

      // 2. Try to add task without current project
      result = await runCLI(['task', 'add', 'Test Task']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No current project set');

      // 3. Create project and try invalid operations
      result = await runCLI(['project', 'init', 'Error-Test-Project']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Error-Test-Project']);
      expect(result.exitCode).toBe(0);

      // 4. Try to start time tracking on non-existent task
      result = await runCLI(['time', 'start', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      // 5. Try to stop time tracking when none is active
      result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No active time session');

      // 6. Try to update non-existent task
      result = await runCLI(['task', 'update', 'NON-EXISTENT', '--title', 'New Title']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      // 7. Try to delete non-existent task
      result = await runCLI(['task', 'delete', 'NON-EXISTENT', '--force']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      // 8. Try to show non-existent project
      result = await runCLI(['project', 'show', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      // 9. Try to switch to non-existent project
      result = await runCLI(['project', 'switch', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      // 10. Try to set invalid configuration key
      result = await runCLI(['config', 'set', 'invalid.key', 'value']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid configuration key');

      // 11. Clean up
      result = await runCLI(['project', 'delete', 'Error-Test-Project', '--force']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle concurrent operations', async () => {
      // 1. Create multiple projects concurrently
      const projectPromises = [
        runCLI(['project', 'init', 'Concurrent-Project-1']),
        runCLI(['project', 'init', 'Concurrent-Project-2']),
        runCLI(['project', 'init', 'Concurrent-Project-3']),
      ];

      const results = await Promise.all(projectPromises);
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });

      // 2. List projects to verify all were created
      const listResult = await runCLI(['project', 'list']);
      expect(listResult.exitCode).toBe(0);
      expect(listResult.stdout).toContain('Concurrent-Project-1');
      expect(listResult.stdout).toContain('Concurrent-Project-2');
      expect(listResult.stdout).toContain('Concurrent-Project-3');

      // 3. Clean up all projects
      const deletePromises = [
        runCLI(['project', 'delete', 'Concurrent-Project-1', '--force']),
        runCLI(['project', 'delete', 'Concurrent-Project-2', '--force']),
        runCLI(['project', 'delete', 'Concurrent-Project-3', '--force']),
      ];

      const deleteResults = await Promise.all(deletePromises);
      deleteResults.forEach(result => {
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of tasks efficiently', async () => {
      // 1. Create project
      let result = await runCLI(['project', 'init', 'Performance-Test', '--description', 'Performance test with many tasks']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Performance-Test']);
      expect(result.exitCode).toBe(0);

      // 2. Create many tasks
      const startTime = Date.now();
      for (let i = 1; i <= 50; i++) {
        result = await runCLI(['task', 'add', `Performance Task ${i}`, '--description', `Task ${i} for performance testing`]);
        expect(result.exitCode).toBe(0);
      }
      const endTime = Date.now();

      // 3. Verify creation time is reasonable
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // 4. List tasks
      const listStartTime = Date.now();
      result = await runCLI(['task', 'list']);
      const listEndTime = Date.now();
      expect(result.exitCode).toBe(0);
      expect(listEndTime - listStartTime).toBeLessThan(2000); // Should complete within 2 seconds

      // 5. Clean up
      result = await runCLI(['project', 'delete', 'Performance-Test', '--force']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle large number of time sessions efficiently', async () => {
      // 1. Create project and task
      let result = await runCLI(['project', 'init', 'Time-Performance-Test', '--description', 'Time session performance test']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['project', 'switch', 'Time-Performance-Test']);
      expect(result.exitCode).toBe(0);

      result = await runCLI(['task', 'add', 'Time Performance Task', '--description', 'Task for time session performance testing']);
      expect(result.exitCode).toBe(0);

      // 2. Create many time sessions
      const startTime = Date.now();
      for (let i = 1; i <= 20; i++) {
        result = await runCLI(['time', 'start', 'TASK-1']);
        expect(result.exitCode).toBe(0);
        
        result = await runCLI(['time', 'stop']);
        expect(result.exitCode).toBe(0);
      }
      const endTime = Date.now();

      // 3. Verify creation time is reasonable
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds

      // 4. Generate time report
      const reportStartTime = Date.now();
      result = await runCLI(['report', 'time']);
      const reportEndTime = Date.now();
      expect(result.exitCode).toBe(0);
      expect(reportEndTime - reportStartTime).toBeLessThan(3000); // Should complete within 3 seconds

      // 5. Clean up
      result = await runCLI(['project', 'delete', 'Time-Performance-Test', '--force']);
      expect(result.exitCode).toBe(0);
    });
  });
});
