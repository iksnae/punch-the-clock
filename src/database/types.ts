// Database connection types and interfaces

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
}

export interface ConnectionPool {
  getConnection(): Promise<any>;
  releaseConnection(connection: any): void;
  end(): Promise<void>;
}

export interface QueryResult<T = any> {
  results: T[];
  fields: any[];
  affectedRows: number;
  insertId: number;
  changedRows: number;
}

export interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  executeQuery<T>(sql: string, params?: any[]): Promise<T[]>;
  executeTransaction<T>(operations: () => Promise<T>): Promise<T>;
  migrate(): Promise<void>;
}

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  executedAt?: Date;
}

export interface DatabaseHealth {
  connected: boolean;
  version: string;
  uptime: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
}
