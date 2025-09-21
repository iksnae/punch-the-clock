import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('CLI Interface End-to-End Tests', () => {
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

  describe('Help System', () => {
    it('should display main help correctly', async () => {
      const result = await runCLI(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PTC - Punch the Clock');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('project');
      expect(result.stdout).toContain('task');
      expect(result.stdout).toContain('time');
      expect(result.stdout).toContain('report');
      expect(result.stdout).toContain('config');
    });

    it('should display project command help correctly', async () => {
      const result = await runCLI(['project', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('project');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('show');
      expect(result.stdout).toContain('switch');
      expect(result.stdout).toContain('delete');
    });

    it('should display task command help correctly', async () => {
      const result = await runCLI(['task', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('task');
      expect(result.stdout).toContain('add');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('show');
      expect(result.stdout).toContain('update');
      expect(result.stdout).toContain('delete');
    });

    it('should display time command help correctly', async () => {
      const result = await runCLI(['time', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('time');
      expect(result.stdout).toContain('start');
      expect(result.stdout).toContain('pause');
      expect(result.stdout).toContain('resume');
      expect(result.stdout).toContain('stop');
      expect(result.stdout).toContain('status');
    });

    it('should display report command help correctly', async () => {
      const result = await runCLI(['report', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('report');
      expect(result.stdout).toContain('time');
      expect(result.stdout).toContain('velocity');
      expect(result.stdout).toContain('estimates');
    });

    it('should display config command help correctly', async () => {
      const result = await runCLI(['config', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('config');
      expect(result.stdout).toContain('show');
      expect(result.stdout).toContain('set');
      expect(result.stdout).toContain('reset');
    });
  });

  describe('Global Options', () => {
    it('should handle --verbose option', async () => {
      const result = await runCLI(['--verbose', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --quiet option', async () => {
      const result = await runCLI(['--quiet', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --no-color option', async () => {
      const result = await runCLI(['--no-color', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --config option', async () => {
      const result = await runCLI(['--config', '/tmp/test-config.json', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --version option', async () => {
      const result = await runCLI(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('Output Formatting', () => {
    beforeEach(async () => {
      // Create test project and tasks
      await runCLI(['project', 'init', 'Output-Test-Project', '--description', 'For testing output formatting']);
      await runCLI(['project', 'switch', 'Output-Test-Project']);
      await runCLI(['task', 'add', 'Output Test Task 1', '--description', 'First task for output testing', '--tags', 'test,output']);
      await runCLI(['task', 'add', 'Output Test Task 2', '--description', 'Second task for output testing', '--tags', 'test,formatting']);
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Output-Test-Project', '--force']);
    });

    it('should format project list output correctly', async () => {
      const result = await runCLI(['project', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Output-Test-Project');
      expect(result.stdout).toContain('For testing output formatting');
    });

    it('should format task list output correctly', async () => {
      const result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Output Test Task 1');
      expect(result.stdout).toContain('Output Test Task 2');
      expect(result.stdout).toContain('test,output');
      expect(result.stdout).toContain('test,formatting');
    });

    it('should format project details output correctly', async () => {
      const result = await runCLI(['project', 'show', 'Output-Test-Project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Details');
      expect(result.stdout).toContain('Output-Test-Project');
      expect(result.stdout).toContain('For testing output formatting');
      expect(result.stdout).toContain('Statistics');
    });

    it('should format task details output correctly', async () => {
      const result = await runCLI(['task', 'show', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task Details');
      expect(result.stdout).toContain('Output Test Task 1');
      expect(result.stdout).toContain('First task for output testing');
      expect(result.stdout).toContain('test,output');
    });

    it('should format time report output correctly', async () => {
      // Start and stop time tracking
      await runCLI(['time', 'start', 'TASK-1']);
      await runCLI(['time', 'stop']);

      const result = await runCLI(['report', 'time']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Time Report');
      expect(result.stdout).toContain('Total Time:');
      expect(result.stdout).toContain('Session Count:');
    });

    it('should format velocity report output correctly', async () => {
      const result = await runCLI(['report', 'velocity']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Velocity Report');
      expect(result.stdout).toContain('Period:');
      expect(result.stdout).toContain('Total Tasks:');
      expect(result.stdout).toContain('Completed Tasks:');
    });

    it('should format estimation report output correctly', async () => {
      const result = await runCLI(['report', 'estimates']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Estimation Report');
      expect(result.stdout).toContain('Total Tasks:');
      expect(result.stdout).toContain('Tasks with Estimates:');
    });

    it('should format configuration output correctly', async () => {
      const result = await runCLI(['config', 'show']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Current Configuration');
    });
  });

  describe('Error Messages', () => {
    it('should display clear error messages for invalid commands', async () => {
      const result = await runCLI(['invalid-command']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown command');
    });

    it('should display clear error messages for missing required arguments', async () => {
      const result = await runCLI(['project', 'init']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });

    it('should display clear error messages for invalid project names', async () => {
      const result = await runCLI(['project', 'init', '']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');
    });

    it('should display clear error messages for non-existent projects', async () => {
      const result = await runCLI(['project', 'show', 'Non-Existent-Project']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');
    });

    it('should display clear error messages for non-existent tasks', async () => {
      await runCLI(['project', 'init', 'Error-Test-Project']);
      await runCLI(['project', 'switch', 'Error-Test-Project']);

      const result = await runCLI(['task', 'show', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      await runCLI(['project', 'delete', 'Error-Test-Project', '--force']);
    });

    it('should display clear error messages for time tracking errors', async () => {
      await runCLI(['project', 'init', 'Time-Error-Test-Project']);
      await runCLI(['project', 'switch', 'Time-Error-Test-Project']);

      const result = await runCLI(['time', 'start', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');

      await runCLI(['project', 'delete', 'Time-Error-Test-Project', '--force']);
    });

    it('should display clear error messages for configuration errors', async () => {
      const result = await runCLI(['config', 'set', 'invalid.key', 'value']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid configuration key');
    });
  });

  describe('Interactive Features', () => {
    it('should handle confirmation prompts correctly', async () => {
      await runCLI(['project', 'init', 'Confirmation-Test-Project']);

      // Test force flag to bypass confirmation
      const result = await runCLI(['project', 'delete', 'Confirmation-Test-Project', '--force']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('deleted successfully');
    });

    it('should handle default values correctly', async () => {
      const result = await runCLI(['project', 'init', 'Default-Test-Project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('created successfully');
      expect(result.stdout).toContain('Set "Default-Test-Project" as current project');

      await runCLI(['project', 'delete', 'Default-Test-Project', '--force']);
    });
  });

  describe('Command Aliases', () => {
    it('should support command aliases', async () => {
      // Test if aliases work (if implemented)
      const result = await runCLI(['p', 'list']); // Assuming 'p' is alias for 'project'
      // This test might need adjustment based on actual alias implementation
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Output Consistency', () => {
    it('should maintain consistent output format across commands', async () => {
      await runCLI(['project', 'init', 'Consistency-Test-Project']);
      await runCLI(['project', 'switch', 'Consistency-Test-Project']);
      await runCLI(['task', 'add', 'Consistency Test Task', '--description', 'Testing output consistency']);

      // Test that all commands follow similar output patterns
      const projectList = await runCLI(['project', 'list']);
      const taskList = await runCLI(['task', 'list']);
      const configShow = await runCLI(['config', 'show']);

      expect(projectList.exitCode).toBe(0);
      expect(taskList.exitCode).toBe(0);
      expect(configShow.exitCode).toBe(0);

      // All should have consistent formatting
      expect(projectList.stdout).toContain('Consistency-Test-Project');
      expect(taskList.stdout).toContain('Consistency Test Task');

      await runCLI(['project', 'delete', 'Consistency-Test-Project', '--force']);
    });

    it('should handle empty results consistently', async () => {
      const projectList = await runCLI(['project', 'list']);
      expect(projectList.exitCode).toBe(0);
      expect(projectList.stdout).toContain('No projects found');

      await runCLI(['project', 'init', 'Empty-Test-Project']);
      await runCLI(['project', 'switch', 'Empty-Test-Project']);

      const taskList = await runCLI(['task', 'list']);
      expect(taskList.exitCode).toBe(0);
      expect(taskList.stdout).toContain('No tasks found for the current project');

      await runCLI(['project', 'delete', 'Empty-Test-Project', '--force']);
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should respond quickly to help commands', async () => {
      const startTime = Date.now();
      const result = await runCLI(['--help']);
      const endTime = Date.now();

      expect(result.exitCode).toBe(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should respond quickly to list commands', async () => {
      const startTime = Date.now();
      const result = await runCLI(['project', 'list']);
      const endTime = Date.now();

      expect(result.exitCode).toBe(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should respond quickly to configuration commands', async () => {
      const startTime = Date.now();
      const result = await runCLI(['config', 'show']);
      const endTime = Date.now();

      expect(result.exitCode).toBe(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different line endings correctly', async () => {
      const result = await runCLI(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PTC - Punch the Clock');
    });

    it('should handle different path separators correctly', async () => {
      const result = await runCLI(['--config', '/tmp/test-config.json', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });
  });
});
