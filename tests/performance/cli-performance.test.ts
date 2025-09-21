import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('CLI Performance Tests', () => {
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

  const runCLI = (args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number; duration: number }> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
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
        const endTime = Date.now();
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          duration: endTime - startTime,
        });
      });
    });
  };

  describe('CLI Startup Performance', () => {
    it('should start up quickly', async () => {
      const result = await runCLI(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should start within 1 second
    });

    it('should handle help commands quickly', async () => {
      const commands = [
        ['--help'],
        ['project', '--help'],
        ['task', '--help'],
        ['time', '--help'],
        ['report', '--help'],
        ['config', '--help'],
      ];

      for (const command of commands) {
        const result = await runCLI(command);
        expect(result.exitCode).toBe(0);
        expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      }
    });

    it('should handle version command quickly', async () => {
      const result = await runCLI(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Project Operations Performance', () => {
    it('should create projects quickly', async () => {
      const startTime = Date.now();
      
      // Create multiple projects
      const results = [];
      for (let i = 1; i <= 10; i++) {
        const result = await runCLI(['project', 'init', `Perf-Project-${i}`, '--description', `Performance test project ${i}`]);
        results.push(result);
      }
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });
      
      expect(totalDuration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(totalDuration / 10).toBeLessThan(2000); // Average should be less than 2 seconds per project
      
      // Clean up
      for (let i = 1; i <= 10; i++) {
        await runCLI(['project', 'delete', `Perf-Project-${i}`, '--force']);
      }
    });

    it('should list projects quickly', async () => {
      // Create some projects first
      for (let i = 1; i <= 5; i++) {
        await runCLI(['project', 'init', `List-Perf-Project-${i}`, '--description', `List performance test project ${i}`]);
      }
      
      const result = await runCLI(['project', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Clean up
      for (let i = 1; i <= 5; i++) {
        await runCLI(['project', 'delete', `List-Perf-Project-${i}`, '--force']);
      }
    });

    it('should switch projects quickly', async () => {
      // Create projects
      await runCLI(['project', 'init', 'Switch-Perf-Project-1', '--description', 'Switch performance test project 1']);
      await runCLI(['project', 'init', 'Switch-Perf-Project-2', '--description', 'Switch performance test project 2']);
      
      // Test switching
      const result1 = await runCLI(['project', 'switch', 'Switch-Perf-Project-1']);
      expect(result1.exitCode).toBe(0);
      expect(result1.duration).toBeLessThan(1000);
      
      const result2 = await runCLI(['project', 'switch', 'Switch-Perf-Project-2']);
      expect(result2.exitCode).toBe(0);
      expect(result2.duration).toBeLessThan(1000);
      
      // Clean up
      await runCLI(['project', 'delete', 'Switch-Perf-Project-1', '--force']);
      await runCLI(['project', 'delete', 'Switch-Perf-Project-2', '--force']);
    });
  });

  describe('Task Operations Performance', () => {
    beforeEach(async () => {
      await runCLI(['project', 'init', 'Task-Perf-Project', '--description', 'Task performance test project']);
      await runCLI(['project', 'switch', 'Task-Perf-Project']);
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Task-Perf-Project', '--force']);
    });

    it('should create tasks quickly', async () => {
      const startTime = Date.now();
      
      // Create multiple tasks
      const results = [];
      for (let i = 1; i <= 20; i++) {
        const result = await runCLI(['task', 'add', `Perf-Task-${i}`, '--description', `Performance test task ${i}`]);
        results.push(result);
      }
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });
      
      expect(totalDuration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(totalDuration / 20).toBeLessThan(1000); // Average should be less than 1 second per task
    });

    it('should list tasks quickly', async () => {
      // Create some tasks first
      for (let i = 1; i <= 10; i++) {
        await runCLI(['task', 'add', `List-Perf-Task-${i}`, '--description', `List performance test task ${i}`]);
      }
      
      const result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should update tasks quickly', async () => {
      // Create a task first
      await runCLI(['task', 'add', 'Update-Perf-Task', '--description', 'Update performance test task']);
      
      const result = await runCLI(['task', 'update', 'TASK-1', '--title', 'Updated Task Title']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should show task details quickly', async () => {
      // Create a task first
      await runCLI(['task', 'add', 'Show-Perf-Task', '--description', 'Show performance test task']);
      
      const result = await runCLI(['task', 'show', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Time Tracking Performance', () => {
    beforeEach(async () => {
      await runCLI(['project', 'init', 'Time-Perf-Project', '--description', 'Time tracking performance test project']);
      await runCLI(['project', 'switch', 'Time-Perf-Project']);
      await runCLI(['task', 'add', 'Time-Perf-Task', '--description', 'Time tracking performance test task']);
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Time-Perf-Project', '--force']);
    });

    it('should start time tracking quickly', async () => {
      const result = await runCLI(['time', 'start', 'TASK-1']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Clean up
      await runCLI(['time', 'stop']);
    });

    it('should pause time tracking quickly', async () => {
      await runCLI(['time', 'start', 'TASK-1']);
      
      const result = await runCLI(['time', 'pause']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Clean up
      await runCLI(['time', 'stop']);
    });

    it('should resume time tracking quickly', async () => {
      await runCLI(['time', 'start', 'TASK-1']);
      await runCLI(['time', 'pause']);
      
      const result = await runCLI(['time', 'resume']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Clean up
      await runCLI(['time', 'stop']);
    });

    it('should stop time tracking quickly', async () => {
      await runCLI(['time', 'start', 'TASK-1']);
      
      const result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should show time status quickly', async () => {
      await runCLI(['time', 'start', 'TASK-1']);
      
      const result = await runCLI(['time', 'status']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Clean up
      await runCLI(['time', 'stop']);
    });
  });

  describe('Reporting Performance', () => {
    beforeEach(async () => {
      await runCLI(['project', 'init', 'Report-Perf-Project', '--description', 'Reporting performance test project']);
      await runCLI(['project', 'switch', 'Report-Perf-Project']);
      
      // Create tasks with time sessions
      for (let i = 1; i <= 5; i++) {
        await runCLI(['task', 'add', `Report-Perf-Task-${i}`, '--description', `Reporting performance test task ${i}`]);
        await runCLI(['time', 'start', `TASK-${i}`]);
        await runCLI(['time', 'stop']);
      }
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Report-Perf-Project', '--force']);
    });

    it('should generate time reports quickly', async () => {
      const result = await runCLI(['report', 'time']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should generate velocity reports quickly', async () => {
      const result = await runCLI(['report', 'velocity']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should generate estimation reports quickly', async () => {
      const result = await runCLI(['report', 'estimates']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Configuration Performance', () => {
    it('should show configuration quickly', async () => {
      const result = await runCLI(['config', 'show']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should set configuration quickly', async () => {
      const result = await runCLI(['config', 'set', 'database.host', 'localhost']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should reset configuration quickly', async () => {
      const result = await runCLI(['config', 'reset']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent project operations efficiently', async () => {
      const startTime = Date.now();
      
      // Run multiple project operations concurrently
      const operations = [
        runCLI(['project', 'init', 'Concurrent-Project-1', '--description', 'Concurrent project 1']),
        runCLI(['project', 'init', 'Concurrent-Project-2', '--description', 'Concurrent project 2']),
        runCLI(['project', 'init', 'Concurrent-Project-3', '--description', 'Concurrent project 3']),
        runCLI(['project', 'list']),
        runCLI(['config', 'show']),
      ];
      
      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Clean up
      await runCLI(['project', 'delete', 'Concurrent-Project-1', '--force']);
      await runCLI(['project', 'delete', 'Concurrent-Project-2', '--force']);
      await runCLI(['project', 'delete', 'Concurrent-Project-3', '--force']);
    });

    it('should handle concurrent task operations efficiently', async () => {
      await runCLI(['project', 'init', 'Concurrent-Task-Project', '--description', 'Concurrent task project']);
      await runCLI(['project', 'switch', 'Concurrent-Task-Project']);
      
      const startTime = Date.now();
      
      // Run multiple task operations concurrently
      const operations = [
        runCLI(['task', 'add', 'Concurrent-Task-1', '--description', 'Concurrent task 1']),
        runCLI(['task', 'add', 'Concurrent-Task-2', '--description', 'Concurrent task 2']),
        runCLI(['task', 'add', 'Concurrent-Task-3', '--description', 'Concurrent task 3']),
        runCLI(['task', 'list']),
        runCLI(['project', 'show', 'Concurrent-Task-Project']),
      ];
      
      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Clean up
      await runCLI(['project', 'delete', 'Concurrent-Task-Project', '--force']);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large command outputs efficiently', async () => {
      await runCLI(['project', 'init', 'Memory-Test-Project', '--description', 'Memory test project']);
      await runCLI(['project', 'switch', 'Memory-Test-Project']);
      
      // Create many tasks to test large output
      for (let i = 1; i <= 50; i++) {
        await runCLI(['task', 'add', `Memory-Test-Task-${i}`, '--description', `Memory test task ${i}`]);
      }
      
      const result = await runCLI(['task', 'list']);
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(result.stdout.length).toBeGreaterThan(1000); // Should have substantial output
      
      // Clean up
      await runCLI(['project', 'delete', 'Memory-Test-Project', '--force']);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors quickly', async () => {
      const result = await runCLI(['invalid-command']);
      expect(result.exitCode).toBe(1);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle missing arguments quickly', async () => {
      const result = await runCLI(['project', 'init']);
      expect(result.exitCode).toBe(1);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle invalid project names quickly', async () => {
      const result = await runCLI(['project', 'init', '']);
      expect(result.exitCode).toBe(1);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
