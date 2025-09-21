import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Input Validation Tests', () => {
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

  describe('Project Name Validation', () => {
    it('should reject empty project names', async () => {
      const result = await runCLI(['project', 'init', '']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');
    });

    it('should reject project names with only whitespace', async () => {
      const result = await runCLI(['project', 'init', '   ']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');
    });

    it('should reject project names that are too long', async () => {
      const longName = 'a'.repeat(256);
      const result = await runCLI(['project', 'init', longName]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');
    });

    it('should reject project names with invalid characters', async () => {
      const invalidNames = [
        'Project@Name',
        'Project#Name',
        'Project$Name',
        'Project%Name',
        'Project^Name',
        'Project&Name',
        'Project*Name',
        'Project(Name)',
        'Project[Name]',
        'Project{Name}',
        'Project|Name',
        'Project\\Name',
        'Project/Name',
        'Project:Name',
        'Project;Name',
        'Project"Name',
        "Project'Name",
        'Project<Name>',
        'Project,Name',
        'Project.Name',
        'Project?Name',
        'Project!Name',
        'Project~Name',
        'Project`Name',
      ];

      for (const name of invalidNames) {
        const result = await runCLI(['project', 'init', name]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid project name');
      }
    });

    it('should reject reserved project names', async () => {
      const reservedNames = ['default', 'system', 'admin', 'root', 'test'];

      for (const name of reservedNames) {
        const result = await runCLI(['project', 'init', name]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid project name');
      }
    });

    it('should accept valid project names', async () => {
      const validNames = [
        'Valid Project Name',
        'Valid-Project-Name',
        'Valid_Project_Name',
        'ValidProjectName',
        'Project123',
        '123Project',
        'Project-123',
        'Project_123',
      ];

      for (const name of validNames) {
        const result = await runCLI(['project', 'init', name]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('created successfully');

        // Clean up
        await runCLI(['project', 'delete', name, '--force']);
      }
    });

    it('should reject duplicate project names', async () => {
      const projectName = 'Duplicate Test Project';
      
      // Create first project
      const result1 = await runCLI(['project', 'init', projectName]);
      expect(result1.exitCode).toBe(0);

      // Try to create duplicate
      const result2 = await runCLI(['project', 'init', projectName]);
      expect(result2.exitCode).toBe(1);
      expect(result2.stderr).toContain('already exists');

      // Clean up
      await runCLI(['project', 'delete', projectName, '--force']);
    });
  });

  describe('Task Validation', () => {
    beforeEach(async () => {
      await runCLI(['project', 'init', 'Task-Validation-Test', '--description', 'Task validation test project']);
      await runCLI(['project', 'switch', 'Task-Validation-Test']);
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Task-Validation-Test', '--force']);
    });

    it('should reject empty task titles', async () => {
      const result = await runCLI(['task', 'add', '']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });

    it('should reject task titles with only whitespace', async () => {
      const result = await runCLI(['task', 'add', '   ']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });

    it('should reject task titles that are too long', async () => {
      const longTitle = 'a'.repeat(256);
      const result = await runCLI(['task', 'add', longTitle]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('too long');
    });

    it('should reject invalid task states', async () => {
      const result = await runCLI(['task', 'add', 'Valid Task', '--state', 'invalid-state']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid state');
    });

    it('should accept valid task states', async () => {
      const validStates = ['pending', 'in-progress', 'completed', 'blocked'];

      for (const state of validStates) {
        const result = await runCLI(['task', 'add', `Valid Task ${state}`, '--state', state]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('created successfully');
      }
    });

    it('should reject invalid time estimates', async () => {
      const invalidEstimates = [
        'invalid',
        '1x',
        '1y',
        '1z',
        '-1h',
        '0h',
        '1.5.5h',
        '1h2m3s4d',
      ];

      for (const estimate of invalidEstimates) {
        const result = await runCLI(['task', 'add', 'Valid Task', '--estimate', estimate]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid time estimate');
      }
    });

    it('should accept valid time estimates', async () => {
      const validEstimates = [
        '1h',
        '2h30m',
        '1d',
        '1d2h30m',
        '30m',
        '45s',
        '1h30m45s',
        '2d1h30m45s',
      ];

      for (const estimate of validEstimates) {
        const result = await runCLI(['task', 'add', `Valid Task ${estimate}`, '--estimate', estimate]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('created successfully');
      }
    });

    it('should reject invalid size estimates', async () => {
      const invalidSizes = [
        'invalid',
        '0',
        '-1',
        '1.5.5',
        '1x',
        '1y',
        '1z',
      ];

      for (const size of invalidSizes) {
        const result = await runCLI(['task', 'add', 'Valid Task', '--size', size]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid size estimate');
      }
    });

    it('should accept valid size estimates', async () => {
      const validSizes = ['1', '2', '3', '5', '8', '13', '21'];

      for (const size of validSizes) {
        const result = await runCLI(['task', 'add', `Valid Task ${size}`, '--size', size]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('created successfully');
      }
    });

    it('should reject invalid tags', async () => {
      const invalidTags = [
        'tag with spaces',
        'tag@invalid',
        'tag#invalid',
        'tag$invalid',
        'tag%invalid',
        'tag^invalid',
        'tag&invalid',
        'tag*invalid',
        'tag(invalid)',
        'tag[invalid]',
        'tag{invalid}',
        'tag|invalid',
        'tag\\invalid',
        'tag/invalid',
        'tag:invalid',
        'tag;invalid',
        'tag"invalid',
        "tag'invalid",
        'tag<invalid>',
        'tag,invalid',
        'tag.invalid',
        'tag?invalid',
        'tag!invalid',
        'tag~invalid',
        'tag`invalid',
      ];

      for (const tag of invalidTags) {
        const result = await runCLI(['task', 'add', 'Valid Task', '--tags', tag]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid tag');
      }
    });

    it('should accept valid tags', async () => {
      const validTags = [
        'valid-tag',
        'valid_tag',
        'validtag',
        'ValidTag',
        'VALIDTAG',
        'valid123',
        '123valid',
        'valid-123',
        'valid_123',
      ];

      for (const tag of validTags) {
        const result = await runCLI(['task', 'add', `Valid Task ${tag}`, '--tags', tag]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('created successfully');
      }
    });

    it('should reject duplicate task numbers', async () => {
      // Create first task
      const result1 = await runCLI(['task', 'add', 'First Task']);
      expect(result1.exitCode).toBe(0);

      // Try to create task with same number
      const result2 = await runCLI(['task', 'add', 'Second Task', '--number', 'TASK-1']);
      expect(result2.exitCode).toBe(1);
      expect(result2.stderr).toContain('already exists');
    });
  });

  describe('Time Tracking Validation', () => {
    beforeEach(async () => {
      await runCLI(['project', 'init', 'Time-Validation-Test', '--description', 'Time tracking validation test project']);
      await runCLI(['project', 'switch', 'Time-Validation-Test']);
      await runCLI(['task', 'add', 'Time Validation Task', '--description', 'Task for time tracking validation']);
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Time-Validation-Test', '--force']);
    });

    it('should reject starting time tracking on non-existent task', async () => {
      const result = await runCLI(['time', 'start', 'NON-EXISTENT']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');
    });

    it('should reject starting time tracking when already active', async () => {
      await runCLI(['time', 'start', 'TASK-1']);
      
      const result = await runCLI(['time', 'start', 'TASK-1']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('already active');
      
      // Clean up
      await runCLI(['time', 'stop']);
    });

    it('should reject pausing when no active session', async () => {
      const result = await runCLI(['time', 'pause']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No active time session');
    });

    it('should reject resuming when no paused session', async () => {
      const result = await runCLI(['time', 'resume']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No paused time session');
    });

    it('should reject stopping when no active session', async () => {
      const result = await runCLI(['time', 'stop']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No active time session');
    });

    it('should reject invalid time session IDs', async () => {
      const result = await runCLI(['time', 'pause', '--session-id', 'invalid']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid session ID');
    });

    it('should reject negative time session IDs', async () => {
      const result = await runCLI(['time', 'pause', '--session-id', '-1']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid session ID');
    });
  });

  describe('Configuration Validation', () => {
    it('should reject invalid configuration keys', async () => {
      const invalidKeys = [
        'invalid.key',
        'database.invalid',
        'invalid.database.host',
        'database.host.invalid',
        'database.port.invalid',
        'database.user.invalid',
        'database.password.invalid',
        'database.database.invalid',
        'database.connectionLimit.invalid',
        'database.acquireTimeout.invalid',
        'database.timeout.invalid',
        'database.ssl.invalid',
      ];

      for (const key of invalidKeys) {
        const result = await runCLI(['config', 'set', key, 'value']);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid configuration key');
      }
    });

    it('should accept valid configuration keys', async () => {
      const validKeys = [
        'database.host',
        'database.port',
        'database.user',
        'database.password',
        'database.database',
        'database.connectionLimit',
        'database.acquireTimeout',
        'database.timeout',
        'database.ssl',
      ];

      for (const key of validKeys) {
        const result = await runCLI(['config', 'set', key, 'test-value']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Set');
      }
    });

    it('should reject invalid configuration values', async () => {
      const invalidValues = [
        ['database.port', 'invalid'],
        ['database.port', '-1'],
        ['database.port', '65536'],
        ['database.connectionLimit', 'invalid'],
        ['database.connectionLimit', '-1'],
        ['database.connectionLimit', '0'],
        ['database.acquireTimeout', 'invalid'],
        ['database.acquireTimeout', '-1'],
        ['database.timeout', 'invalid'],
        ['database.timeout', '-1'],
        ['database.ssl', 'invalid'],
        ['database.ssl', 'maybe'],
      ];

      for (const [key, value] of invalidValues) {
        const result = await runCLI(['config', 'set', key, value]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid configuration value');
      }
    });

    it('should accept valid configuration values', async () => {
      const validValues = [
        ['database.host', 'localhost'],
        ['database.port', '3306'],
        ['database.user', 'testuser'],
        ['database.password', 'testpassword'],
        ['database.database', 'testdb'],
        ['database.connectionLimit', '10'],
        ['database.acquireTimeout', '60000'],
        ['database.timeout', '60000'],
        ['database.ssl', 'true'],
        ['database.ssl', 'false'],
      ];

      for (const [key, value] of validValues) {
        const result = await runCLI(['config', 'set', key, value]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Set');
      }
    });
  });

  describe('Report Validation', () => {
    beforeEach(async () => {
      await runCLI(['project', 'init', 'Report-Validation-Test', '--description', 'Report validation test project']);
      await runCLI(['project', 'switch', 'Report-Validation-Test']);
    });

    afterEach(async () => {
      await runCLI(['project', 'delete', 'Report-Validation-Test', '--force']);
    });

    it('should reject invalid date formats', async () => {
      const invalidDates = [
        'invalid-date',
        '2023-13-01',
        '2023-01-32',
        '2023/01/01',
        '01-01-2023',
        '2023-1-1',
        '2023-01-1',
      ];

      for (const date of invalidDates) {
        const result = await runCLI(['report', 'time', '--start-date', date]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid date format');
      }
    });

    it('should accept valid date formats', async () => {
      const validDates = [
        '2023-01-01',
        '2023-12-31',
        '2024-02-29',
        '2023-06-15',
      ];

      for (const date of validDates) {
        const result = await runCLI(['report', 'time', '--start-date', date, '--end-date', date]);
        expect(result.exitCode).toBe(0);
      }
    });

    it('should reject invalid periods', async () => {
      const invalidPeriods = [
        'invalid',
        'weekday',
        'monthly',
        'yearly',
        '1',
        '2',
        '3',
      ];

      for (const period of invalidPeriods) {
        const result = await runCLI(['report', 'velocity', '--period', period]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid period');
      }
    });

    it('should accept valid periods', async () => {
      const validPeriods = ['day', 'week', 'month', 'quarter', 'year'];

      for (const period of validPeriods) {
        const result = await runCLI(['report', 'velocity', '--period', period]);
        expect(result.exitCode).toBe(0);
      }
    });

    it('should reject invalid export formats', async () => {
      const invalidFormats = [
        'invalid',
        'xml',
        'pdf',
        'doc',
        'txt',
      ];

      for (const format of invalidFormats) {
        const result = await runCLI(['report', 'time', '--export', format]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Invalid export format');
      }
    });

    it('should accept valid export formats', async () => {
      const validFormats = ['json', 'csv'];

      for (const format of validFormats) {
        const result = await runCLI(['report', 'time', '--export', format]);
        expect(result.exitCode).toBe(0);
      }
    });

    it('should reject invalid date ranges', async () => {
      const result = await runCLI(['report', 'time', '--start-date', '2023-12-31', '--end-date', '2023-01-01']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Start date must be before end date');
    });

    it('should reject future dates', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = await runCLI(['report', 'time', '--start-date', futureDate]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Date cannot be in the future');
    });
  });

  describe('Command Line Arguments Validation', () => {
    it('should reject unknown global options', async () => {
      const result = await runCLI(['--unknown-option', 'project', 'list']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown option');
    });

    it('should reject unknown command options', async () => {
      const result = await runCLI(['project', 'init', 'Test Project', '--unknown-option']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown option');
    });

    it('should reject missing required arguments', async () => {
      const result = await runCLI(['project', 'init']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });

    it('should reject too many arguments', async () => {
      const result = await runCLI(['project', 'init', 'Project 1', 'Project 2', 'Project 3']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('too many arguments');
    });

    it('should reject invalid boolean values', async () => {
      const result = await runCLI(['project', 'init', 'Test Project', '--force', 'maybe']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid boolean value');
    });

    it('should accept valid boolean values', async () => {
      const result = await runCLI(['project', 'init', 'Test Project', '--force', 'true']);
      expect(result.exitCode).toBe(0);
      
      // Clean up
      await runCLI(['project', 'delete', 'Test Project', '--force']);
    });
  });

  describe('File Path Validation', () => {
    it('should reject invalid configuration file paths', async () => {
      const result = await runCLI(['--config', '/invalid/path/config.json', 'project', 'list']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Configuration file not found');
    });

    it('should reject invalid export file paths', async () => {
      const result = await runCLI(['report', 'time', '--export', 'json', '--output', '/invalid/path/report.json']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Output directory not found');
    });

    it('should accept valid file paths', async () => {
      const result = await runCLI(['report', 'time', '--export', 'json', '--output', '/tmp/report.json']);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const result = await runCLI(['project', 'init', longString]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('too long');
    });

    it('should handle special characters in input', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = await runCLI(['project', 'init', specialChars]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');
    });

    it('should handle unicode characters in input', async () => {
      const unicodeString = '测试项目';
      const result = await runCLI(['project', 'init', unicodeString]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project name');
    });

    it('should handle empty arrays in tags', async () => {
      const result = await runCLI(['task', 'add', 'Valid Task', '--tags', '']);
      expect(result.exitCode).toBe(0);
    });

    it('should handle whitespace-only arrays in tags', async () => {
      const result = await runCLI(['task', 'add', 'Valid Task', '--tags', '   ']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid tag');
    });
  });
});
