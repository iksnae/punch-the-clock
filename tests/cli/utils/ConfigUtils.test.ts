import { ConfigUtils } from '../../../src/cli/utils/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
  dirname: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('ConfigUtils', () => {
  const mockConfigPath = '/mock/config/path.json';
  const mockConfig = {
    currentProject: undefined,
    defaultProject: undefined,
    database: {
      host: 'localhost',
      port: 3306,
      user: 'ptc_user',
      password: 'ptc_password',
      database: 'ptc_db',
      ssl: false,
      connectionLimit: 10,
      acquireTimeout: 10000,
      timeout: 10000,
    },
    timezone: 'UTC',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm:ss',
    outputFormat: 'table',
    autoSave: true,
    confirmations: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock path.join to return mock config path
    mockPath.join.mockReturnValue(mockConfigPath);
    
    // Mock path.dirname to return mock directory
    mockPath.dirname.mockReturnValue('/mock/config');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfigPath', () => {
    it('should return the config file path', () => {
      const configPath = ConfigUtils.getConfigPath();
      expect(configPath).toBe(mockConfigPath);
      expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), 'config.json');
    });
  });

  describe('getConfig', () => {
    it('should return default config when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const config = ConfigUtils.getConfig();
      
      expect(config).toEqual({
        currentProject: undefined,
        defaultProject: undefined,
        database: {
          host: 'localhost',
          port: 3306,
          user: 'ptc_user',
          password: 'ptc_password',
          database: 'ptc_db',
          ssl: false,
          connectionLimit: 10,
          acquireTimeout: 10000,
          timeout: 10000,
        },
        timezone: 'UTC',
        dateFormat: 'yyyy-MM-dd',
        timeFormat: 'HH:mm:ss',
        outputFormat: 'table',
        autoSave: true,
        confirmations: true,
      });
    });

    it('should return config from file when it exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const config = ConfigUtils.getConfig();
      
      expect(config).toEqual(mockConfig);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf8');
    });

    it('should return default config when file is invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      const config = ConfigUtils.getConfig();
      
      expect(config).toEqual({
        currentProject: undefined,
        defaultProject: undefined,
        database: {
          host: 'localhost',
          port: 3306,
          user: 'ptc_user',
          password: 'ptc_password',
          database: 'ptc_db',
          ssl: false,
          connectionLimit: 10,
          acquireTimeout: 10000,
          timeout: 10000,
        },
        timezone: 'UTC',
        dateFormat: 'yyyy-MM-dd',
        timeFormat: 'HH:mm:ss',
        outputFormat: 'table',
        autoSave: true,
        confirmations: true,
      });
    });
  });

  describe('setConfigValue', () => {
    it('should set a simple config value', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      ConfigUtils.setConfigValue('database.host', 'newhost');
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({
          ...mockConfig,
          database: {
            ...mockConfig.database,
            host: 'newhost',
          },
        }, null, 2),
        'utf8'
      );
    });

    it('should set a nested config value', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      ConfigUtils.setConfigValue('database.port', 5432);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({
          ...mockConfig,
          database: {
            ...mockConfig.database,
            port: 5432,
          },
        }, null, 2),
        'utf8'
      );
    });

    it('should create config file if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      ConfigUtils.setConfigValue('database.host', 'newhost');
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/config', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"host": "newhost"'),
        'utf8'
      );
    });
  });

  describe('resetConfig', () => {
    it('should reset config to defaults', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      ConfigUtils.resetConfig();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({
          currentProject: undefined,
          defaultProject: undefined,
          database: {
            host: 'localhost',
            port: 3306,
            user: 'ptc_user',
            password: 'ptc_password',
            database: 'ptc_db',
            ssl: false,
            connectionLimit: 10,
            acquireTimeout: 10000,
            timeout: 10000,
          },
          timezone: 'UTC',
          dateFormat: 'yyyy-MM-dd',
          timeFormat: 'HH:mm:ss',
          outputFormat: 'table',
          autoSave: true,
          confirmations: true,
        }, null, 2),
        'utf8'
      );
    });
  });

  describe('getCurrentProject', () => {
    it('should return current project from config', () => {
      const configWithProject = {
        ...mockConfig,
        currentProject: {
          id: 1,
          name: 'Test Project',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(configWithProject));
      
      const currentProject = ConfigUtils.getCurrentProject();
      
      expect(currentProject).toEqual({
        id: 1,
        name: 'Test Project',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      });
    });

    it('should return null when no current project', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const currentProject = ConfigUtils.getCurrentProject();
      
      expect(currentProject).toBeNull();
    });
  });

  describe('setCurrentProject', () => {
    it('should set current project in config', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      const project = {
        id: 1,
        name: 'Test Project',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };
      
      ConfigUtils.setCurrentProject(project);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({
          ...mockConfig,
          currentProject: project,
        }, null, 2),
        'utf8'
      );
    });
  });

  describe('getDatabaseConfig', () => {
    it('should return database config from main config', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const dbConfig = ConfigUtils.getDatabaseConfig();
      
      expect(dbConfig).toEqual(mockConfig.database);
    });

    it('should return default database config when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const dbConfig = ConfigUtils.getDatabaseConfig();
      
      expect(dbConfig).toEqual({
        host: 'localhost',
        port: 3306,
        user: 'ptc_user',
        password: 'ptc_password',
        database: 'ptc_db',
        ssl: false,
        connectionLimit: 10,
        acquireTimeout: 10000,
        timeout: 10000,
      });
    });
  });

  describe('setDatabaseConfig', () => {
    it('should set database config', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      const newDbConfig = {
        host: 'newhost',
        port: 5432,
        database: 'newdb',
        user: 'newuser',
        password: 'newpass',
        ssl: true,
        connectionLimit: 20,
        acquireTimeout: 120000,
        timeout: 60000,
      };
      
      ConfigUtils.setDatabaseConfig(newDbConfig);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({
          ...mockConfig,
          database: newDbConfig,
        }, null, 2),
        'utf8'
      );
    });
  });
});