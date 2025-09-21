import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('CLI Integration Tests', () => {
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

  describe('Help Commands', () => {
    it('should show help when no arguments provided', async () => {
      const result = await runCLI([]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PTC - Punch the Clock');
      expect(result.stdout).toContain('Usage:');
    });

    it('should show help with --help flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PTC - Punch the Clock');
      expect(result.stdout).toContain('Usage:');
    });

    it('should show help for project command', async () => {
      const result = await runCLI(['project', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('project');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('list');
    });

    it('should show help for task command', async () => {
      const result = await runCLI(['task', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('task');
      expect(result.stdout).toContain('add');
      expect(result.stdout).toContain('list');
    });

    it('should show help for time command', async () => {
      const result = await runCLI(['time', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('time');
      expect(result.stdout).toContain('start');
      expect(result.stdout).toContain('stop');
    });

    it('should show help for report command', async () => {
      const result = await runCLI(['report', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('report');
      expect(result.stdout).toContain('time');
      expect(result.stdout).toContain('velocity');
    });

    it('should show help for config command', async () => {
      const result = await runCLI(['config', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('config');
      expect(result.stdout).toContain('show');
      expect(result.stdout).toContain('set');
    });
  });

  describe('Project Commands', () => {
    it('should create a new project', async () => {
      const result = await runCLI(['project', 'init', 'test-project', '--description', 'A test project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project "test-project" created successfully');
    });

    it('should list projects', async () => {
      const result = await runCLI(['project', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-project');
    });

    it('should show project details', async () => {
      const result = await runCLI(['project', 'show', 'test-project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project Details');
      expect(result.stdout).toContain('test-project');
    });

    it('should switch to project', async () => {
      const result = await runCLI(['project', 'switch', 'test-project']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Switched to project "test-project"');
    });

    it('should delete project', async () => {
      const result = await runCLI(['project', 'delete', 'test-project', '--force']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project "test-project" deleted successfully');
    });
  });

  describe('Task Commands', () => {
    beforeEach(async () => {
      // Create a test project for task operations
      await runCLI(['project', 'init', 'test-project', '--description', 'A test project']);
      await runCLI(['project', 'switch', 'test-project']);
    });

    afterEach(async () => {
      // Clean up test project
      await runCLI(['project', 'delete', 'test-project', '--force']);
    });

    it('should add a new task', async () => {
      const result = await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-1" created successfully');
    });

    it('should list tasks', async () => {
      // First add a task
      await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
      
      const result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Test Task');
    });

    it('should show task details', async () => {
      // First add a task
      await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
      
      const result = await runCLI(['task', 'show', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task Details');
      expect(result.stdout).toContain('Test Task');
    });

    it('should update task', async () => {
      // First add a task
      await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
      
      const result = await runCLI(['task', 'update', 'TASK-1', '--title', 'Updated Task']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-1" updated successfully');
    });

    it('should delete task', async () => {
      // First add a task
      await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
      
      const result = await runCLI(['task', 'delete', 'TASK-1', '--force']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task "TASK-1" deleted successfully');
    });
  });

  describe('Time Tracking Commands', () => {
    beforeEach(async () => {
      // Create a test project and task for time tracking
      await runCLI(['project', 'init', 'test-project', '--description', 'A test project']);
      await runCLI(['project', 'switch', 'test-project']);
      await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
    });

    afterEach(async () => {
      // Clean up test project
      await runCLI(['project', 'delete', 'test-project', '--force']);
    });

    it('should start time tracking', async () => {
      const result = await runCLI(['time', 'start', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Started time tracking for task "TASK-1"');
    });

    it('should show time status', async () => {
      // First start time tracking
      await runCLI(['time', 'start', 'TASK-1']);
      
      const result = await runCLI(['time', 'status']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Active time sessions');
    });

    it('should stop time tracking', async () => {
      // First start time tracking
      await runCLI(['time', 'start', 'TASK-1']);
      
      const result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Stopped time session');
    });
  });

  describe('Report Commands', () => {
    beforeEach(async () => {
      // Create a test project and task for reporting
      await runCLI(['project', 'init', 'test-project', '--description', 'A test project']);
      await runCLI(['project', 'switch', 'test-project']);
      await runCLI(['task', 'add', 'Test Task', '--description', 'A test task']);
    });

    afterEach(async () => {
      // Clean up test project
      await runCLI(['project', 'delete', 'test-project', '--force']);
    });

    it('should generate time report', async () => {
      const result = await runCLI(['report', 'time']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Time Report');
    });

    it('should generate velocity report', async () => {
      const result = await runCLI(['report', 'velocity']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Velocity Report');
    });

    it('should generate estimation report', async () => {
      const result = await runCLI(['report', 'estimates']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Estimation Report');
    });
  });

  describe('Config Commands', () => {
    it('should show configuration', async () => {
      const result = await runCLI(['config', 'show']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Current Configuration');
    });

    it('should set configuration value', async () => {
      const result = await runCLI(['config', 'set', 'database.host', 'localhost']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Set database.host = localhost');
    });

    it('should reset configuration', async () => {
      const result = await runCLI(['config', 'reset']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration reset to defaults');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid command', async () => {
      const result = await runCLI(['invalid-command']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown command');
    });

    it('should handle missing project for task operations', async () => {
      const result = await runCLI(['task', 'add', 'Test Task']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No current project set');
    });

    it('should handle missing task for time operations', async () => {
      await runCLI(['project', 'init', 'test-project']);
      await runCLI(['project', 'switch', 'test-project']);
      
      const result = await runCLI(['time', 'start', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');
    });

    it('should handle invalid configuration key', async () => {
      const result = await runCLI(['config', 'set', 'invalid.key', 'value']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid configuration key');
    });
  });

  describe('Global Options', () => {
    it('should handle --verbose flag', async () => {
      const result = await runCLI(['--verbose', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --quiet flag', async () => {
      const result = await runCLI(['--quiet', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --no-color flag', async () => {
      const result = await runCLI(['--no-color', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle --config flag', async () => {
      const result = await runCLI(['--config', '/tmp/test-config.json', 'project', 'list']);
      expect(result.exitCode).toBe(0);
    });
  });
});
