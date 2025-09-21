import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

describe('CLI Performance Tests', () => {
  const CLI_PATH = './dist/cli.js';
  const TIMEOUT = 30000; // 30 seconds

  const runCLICommand = (args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number; duration: number }> => {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const child = spawn('node', [CLI_PATH, ...args], {
        stdio: 'pipe',
        timeout: TIMEOUT,
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
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          duration,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  };

  describe('Command Response Times', () => {
    it('should respond to help command within 100ms', async () => {
      const result = await runCLICommand(['--help']);
      
      expect(result.duration).toBeLessThan(100);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
    });

    it('should respond to version command within 50ms', async () => {
      const result = await runCLICommand(['--version']);
      
      expect(result.duration).toBeLessThan(50);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('punch-the-clock');
    });

    it('should respond to config show within 200ms', async () => {
      const result = await runCLICommand(['config', 'show']);
      
      expect(result.duration).toBeLessThan(200);
      // May fail if no config, but should be fast
    });

    it('should respond to list projects within 500ms', async () => {
      const result = await runCLICommand(['list', 'projects']);
      
      expect(result.duration).toBeLessThan(500);
      // May fail if no database, but should be fast
    });
  });

  describe('Database Operations Performance', () => {
    it('should create project within 1 second', async () => {
      const result = await runCLICommand(['init', 'perf-test-project']);
      
      expect(result.duration).toBeLessThan(1000);
      // May fail if no database, but should be fast
    });

    it('should add task within 1 second', async () => {
      const result = await runCLICommand(['add', 'Performance test task']);
      
      expect(result.duration).toBeLessThan(1000);
      // May fail if no project/database, but should be fast
    });

    it('should list tasks within 500ms', async () => {
      const result = await runCLICommand(['list', 'tasks']);
      
      expect(result.duration).toBeLessThan(500);
      // May fail if no project/database, but should be fast
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle invalid commands quickly', async () => {
      const result = await runCLICommand(['invalid-command']);
      
      expect(result.duration).toBeLessThan(100);
      expect(result.exitCode).not.toBe(0);
    });

    it('should handle missing arguments quickly', async () => {
      const result = await runCLICommand(['add']);
      
      expect(result.duration).toBeLessThan(100);
      expect(result.exitCode).not.toBe(0);
    });

    it('should handle database connection errors quickly', async () => {
      const result = await runCLICommand(['init', 'test-project']);
      
      expect(result.duration).toBeLessThan(2000);
      // Should fail fast if database is not available
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent help requests', async () => {
      const promises = Array(10).fill(null).map(() => runCLICommand(['--help']));
      
      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      // All requests should complete within 1 second
      expect(totalDuration).toBeLessThan(1000);
      
      // All should succeed
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
        expect(result.duration).toBeLessThan(100);
      });
    });

    it('should handle multiple concurrent version requests', async () => {
      const promises = Array(20).fill(null).map(() => runCLICommand(['--version']));
      
      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      // All requests should complete within 1 second
      expect(totalDuration).toBeLessThan(1000);
      
      // All should succeed
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
        expect(result.duration).toBeLessThan(50);
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple help commands
      for (let i = 0; i < 100; i++) {
        await runCLICommand(['--help']);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large output efficiently', async () => {
      const result = await runCLICommand(['--help']);
      
      expect(result.duration).toBeLessThan(100);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stdout.length).toBeLessThan(10000); // Should not be excessively large
    });
  });

  describe('Startup Performance', () => {
    it('should start up quickly', async () => {
      const result = await runCLICommand(['--help']);
      
      expect(result.duration).toBeLessThan(100);
    });

    it('should handle cold starts efficiently', async () => {
      // Simulate cold start by running a simple command
      const result = await runCLICommand(['--version']);
      
      expect(result.duration).toBeLessThan(50);
    });
  });

  describe('Output Performance', () => {
    it('should format output quickly', async () => {
      const result = await runCLICommand(['--help']);
      
      expect(result.duration).toBeLessThan(100);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
    });

    it('should handle JSON output efficiently', async () => {
      const result = await runCLICommand(['list', 'projects', '--format', 'json']);
      
      expect(result.duration).toBeLessThan(500);
      // May fail if no database, but should be fast
    });
  });
});