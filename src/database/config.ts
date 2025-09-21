import { DatabaseConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseConfigManager {
  private config: DatabaseConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): DatabaseConfig {
    // Load from environment variables first
    const envConfig: DatabaseConfig = {
      host: process.env.PTC_DB_HOST || 'localhost',
      port: parseInt(process.env.PTC_DB_PORT || '3306', 10),
      user: process.env.PTC_DB_USER || 'root',
      password: process.env.PTC_DB_PASSWORD || '',
      database: process.env.PTC_DB_DATABASE || 'ptc',
      ssl: process.env.PTC_DB_SSL === 'true',
      connectionLimit: parseInt(process.env.PTC_DB_CONNECTION_LIMIT || '10', 10),
      acquireTimeout: parseInt(process.env.PTC_DB_ACQUIRE_TIMEOUT || '60000', 10),
      timeout: parseInt(process.env.PTC_DB_TIMEOUT || '60000', 10),
    };

    // Try to load from config file
    const configPath = this.getConfigPath();
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...envConfig, ...fileConfig };
      } catch (error) {
        console.warn('Failed to load database config file, using environment variables');
      }
    }

    return envConfig;
  }

  private getConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, '.ptc', 'database.json');
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private saveConfig(): void {
    const configPath = this.getConfigPath();
    const configDir = path.dirname(configPath);
    
    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.warn('Failed to save database config file:', error);
    }
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.host) {
      errors.push('Database host is required');
    }

    if (!this.config.port || this.config.port < 1 || this.config.port > 65535) {
      errors.push('Database port must be between 1 and 65535');
    }

    if (!this.config.user) {
      errors.push('Database user is required');
    }

    if (!this.config.database) {
      errors.push('Database name is required');
    }

    if (this.config.connectionLimit && this.config.connectionLimit < 1) {
      errors.push('Connection limit must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
