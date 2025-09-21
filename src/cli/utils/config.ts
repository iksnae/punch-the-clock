import * as fs from 'fs';
import * as path from 'path';
import { Project } from '../../types/Project';

export interface GlobalOptions {
  verbose?: boolean;
  quiet?: boolean;
  noColor?: boolean;
  config?: string;
}

export interface PTCConfig {
  currentProject?: Project;
  defaultProject?: string;
  database?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean;
    connectionLimit?: number;
    acquireTimeout?: number;
    timeout?: number;
  };
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  outputFormat?: 'table' | 'json';
  autoSave?: boolean;
  confirmations?: boolean;
}

export class ConfigUtils {
  private static globalOptions: GlobalOptions = {};
  private static config: PTCConfig = {};
  private static configPath: string = '';

  public static setGlobalOptions(options: GlobalOptions): void {
    this.globalOptions = { ...options };
  }

  public static getGlobalOptions(): GlobalOptions {
    return { ...this.globalOptions };
  }

  public static getConfigPath(): string {
    if (this.configPath) {
      return this.configPath;
    }

    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const ptcDir = path.join(homeDir, '.ptc');
    
    if (!fs.existsSync(ptcDir)) {
      fs.mkdirSync(ptcDir, { recursive: true });
    }

    this.configPath = path.join(ptcDir, 'config.json');
    return this.configPath;
  }

  public static loadConfig(): PTCConfig {
    const configPath = this.getConfigPath();
    
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(configData);
      } catch (error) {
        console.warn('Failed to load config file, using defaults');
        this.config = this.getDefaultConfig();
      }
    } else {
      this.config = this.getDefaultConfig();
      this.saveConfig();
    }

    return { ...this.config };
  }

  public static saveConfig(): void {
    const configPath = this.getConfigPath();
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.warn('Failed to save config file:', error);
    }
  }

  public static getConfig(): PTCConfig {
    if (Object.keys(this.config).length === 0) {
      return this.loadConfig();
    }
    return { ...this.config };
  }

  public static setConfigValue(key: string, value: any): void {
    this.config = this.getConfig();
    
    const keys = key.split('.');
    let current: any = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    this.saveConfig();
  }

  public static getConfigValue(key: string): any {
    const config = this.getConfig();
    const keys = key.split('.');
    let current: any = config;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  public static setCurrentProject(project: Project): void {
    this.config = this.getConfig();
    this.config.currentProject = project;
    this.saveConfig();
  }

  public static getCurrentProject(): Project | undefined {
    return this.getConfig().currentProject;
  }

  public static setDefaultProject(projectName: string): void {
    this.setConfigValue('defaultProject', projectName);
  }

  public static getDefaultProject(): string | undefined {
    return this.getConfigValue('defaultProject');
  }

  public static setDatabaseConfig(config: PTCConfig['database']): void {
    this.setConfigValue('database', config);
  }

  public static getDatabaseConfig(): PTCConfig['database'] | undefined {
    return this.getConfigValue('database');
  }

  public static setTimezone(timezone: string): void {
    this.setConfigValue('timezone', timezone);
  }

  public static getTimezone(): string {
    return this.getConfigValue('timezone') || 'UTC';
  }

  public static setDateFormat(format: string): void {
    this.setConfigValue('dateFormat', format);
  }

  public static getDateFormat(): string {
    return this.getConfigValue('dateFormat') || 'YYYY-MM-DD';
  }

  public static setTimeFormat(format: string): void {
    this.setConfigValue('timeFormat', format);
  }

  public static getTimeFormat(): string {
    return this.getConfigValue('timeFormat') || 'HH:mm:ss';
  }

  public static setOutputFormat(format: 'table' | 'json'): void {
    this.setConfigValue('outputFormat', format);
  }

  public static getOutputFormat(): 'table' | 'json' {
    return this.getConfigValue('outputFormat') || 'table';
  }

  public static setAutoSave(enabled: boolean): void {
    this.setConfigValue('autoSave', enabled);
  }

  public static getAutoSave(): boolean {
    return this.getConfigValue('autoSave') ?? true;
  }

  public static setConfirmations(enabled: boolean): void {
    this.setConfigValue('confirmations', enabled);
  }

  public static getConfirmations(): boolean {
    return this.getConfigValue('confirmations') ?? true;
  }

  public static resetConfig(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
  }

  public static getDefaultConfig(): PTCConfig {
    return {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',
      outputFormat: 'table',
      autoSave: true,
      confirmations: true,
    };
  }

  public static validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfig();

    if (config.database) {
      if (!config.database.host) {
        errors.push('Database host is required');
      }
      if (!config.database.port || config.database.port < 1 || config.database.port > 65535) {
        errors.push('Database port must be between 1 and 65535');
      }
      if (!config.database.user) {
        errors.push('Database user is required');
      }
      if (!config.database.database) {
        errors.push('Database name is required');
      }
    }

    if (config.timezone && !this.isValidTimezone(config.timezone)) {
      errors.push('Invalid timezone format');
    }

    if (config.outputFormat && !['table', 'json'].includes(config.outputFormat)) {
      errors.push('Output format must be either "table" or "json"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  public static exportConfig(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  public static importConfig(configJson: string): { success: boolean; errors: string[] } {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...this.getDefaultConfig(), ...importedConfig };
      
      const validation = this.validateConfig();
      if (validation.valid) {
        this.saveConfig();
        return { success: true, errors: [] };
      } else {
        return { success: false, errors: validation.errors };
      }
    } catch (error) {
      return { success: false, errors: ['Invalid JSON format'] };
    }
  }
}
