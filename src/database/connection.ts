import mysql from 'mysql2/promise';
import { DatabaseConfig, ConnectionPool, QueryResult, DatabaseService, DatabaseHealth } from './types';
import { DatabaseConfigManager } from './config';

export class DatabaseConnection implements DatabaseService {
  private pool: ConnectionPool | null = null;
  private configManager: DatabaseConfigManager;
  private connected: boolean = false;
  private startTime: number = Date.now();

  constructor() {
    this.configManager = new DatabaseConfigManager();
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const config = this.configManager.getConfig();
    const validation = this.configManager.validateConfig();
    
    if (!validation.valid) {
      throw new Error(`Invalid database configuration: ${validation.errors.join(', ')}`);
    }

    try {
      const poolConfig: any = {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionLimit: config.connectionLimit,
        acquireTimeout: config.acquireTimeout,
        timeout: config.timeout,
        waitForConnections: true,
        queueLimit: 0,
        reconnect: true,
        charset: 'utf8mb4',
      };

      if (config.ssl) {
        poolConfig.ssl = {};
      }

      this.pool = mysql.createPool(poolConfig);

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.connected = true;
      console.log(`Connected to MySQL database: ${config.host}:${config.port}/${config.database}`);
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool && this.connected) {
      try {
        await this.pool.end();
        this.connected = false;
        console.log('Disconnected from database');
      } catch (error) {
        console.error('Error disconnecting from database:', error);
        throw error;
      }
    }
  }

  public isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  public async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    try {
      const [rows] = await (this.pool as any).execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  public async executeTransaction<T>(operations: () => Promise<T>): Promise<T> {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    const connection = await this.pool!.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await operations();
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async migrate(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    try {
      // Check if migrations table exists
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          version VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_version (version)
        )
      `);

      // Get list of executed migrations
      const executedMigrations = await this.executeQuery<{ version: string }>(
        'SELECT version FROM migrations ORDER BY version'
      );
      const executedVersions = new Set(executedMigrations.map(m => m.version));

      // Get list of available migrations
      const fs = require('fs');
      const path = require('path');
      const migrationsDir = path.join(__dirname, 'migrations');
      
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs.readdirSync(migrationsDir)
          .filter((file: string) => file.endsWith('.sql'))
          .sort();

        for (const file of migrationFiles) {
          const version = file.split('_')[0];
          
          if (!executedVersions.has(version)) {
            console.log(`Executing migration: ${file}`);
            const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            
            // Split migration into individual statements
            const statements = migrationSQL
              .split(';')
              .map((stmt: string) => stmt.trim())
              .filter((stmt: string) => stmt.length > 0);

            await this.executeTransaction(async () => {
              for (const statement of statements) {
                await this.executeQuery(statement);
              }
              
              // Record migration as executed
              await this.executeQuery(
                'INSERT INTO migrations (version, name) VALUES (?, ?)',
                [version, file]
              );
            });

            console.log(`Migration ${file} executed successfully`);
          }
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw new Error(`Database migration failed: ${error}`);
    }
  }

  public async getHealth(): Promise<DatabaseHealth> {
    if (!this.isConnected()) {
      return {
        connected: false,
        version: 'unknown',
        uptime: 0,
        connections: { active: 0, idle: 0, total: 0 },
      };
    }

    try {
      const versionResult = await this.executeQuery<{ version: string }>('SELECT VERSION() as version');
      const version = versionResult[0]?.version || 'unknown';

      return {
        connected: true,
        version,
        uptime: Date.now() - this.startTime,
        connections: {
          active: (this.pool as any).pool?._allConnections?.length || 0,
          idle: (this.pool as any).pool?._freeConnections?.length || 0,
          total: (this.pool as any).pool?._allConnections?.length || 0,
        },
      };
    } catch (error) {
      return {
        connected: false,
        version: 'unknown',
        uptime: Date.now() - this.startTime,
        connections: { active: 0, idle: 0, total: 0 },
      };
    }
  }

  public getConfigManager(): DatabaseConfigManager {
    return this.configManager;
  }
}
