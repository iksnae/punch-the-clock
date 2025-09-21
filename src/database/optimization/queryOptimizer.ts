import { DatabaseConnection } from '../connection';

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
}

export class QueryOptimizer {
  private db: DatabaseConnection;
  private performanceMetrics: QueryPerformanceMetrics[] = [];
  private slowQueryThreshold: number = 100; // ms

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Execute query with performance monitoring
   */
  public async executeOptimizedQuery<T = any>(
    sql: string, 
    params: any[] = [],
    options: { 
      timeout?: number;
      useCache?: boolean;
      explain?: boolean;
    } = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      // Add query timeout if specified
      if (options.timeout) {
        sql = `SET SESSION wait_timeout = ${options.timeout}; ${sql}`;
      }

      // Execute query
      const result = await this.db.executeQuery<T>(sql, params);
      
      const executionTime = Date.now() - startTime;
      
      // Record performance metrics
      this.recordPerformanceMetrics({
        query: sql,
        executionTime,
        rowsAffected: Array.isArray(result) ? result.length : 0,
        timestamp: new Date(),
      });

      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        console.warn(`Slow query detected (${executionTime}ms): ${sql.substring(0, 100)}...`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordPerformanceMetrics({
        query: sql,
        executionTime,
        rowsAffected: 0,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Optimize queries for large datasets with pagination
   */
  public async executePaginatedQuery<T = any>(
    sql: string,
    params: any[] = [],
    page: number = 1,
    pageSize: number = 100
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
    const countResult = await this.executeOptimizedQuery<{ total: number }>(countSql, params);
    const total = countResult[0]?.total || 0;

    // Get paginated data
    const paginatedSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
    const data = await this.executeOptimizedQuery<T>(paginatedSql, params);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Optimize bulk operations
   */
  public async executeBulkInsert<T extends Record<string, any>>(
    table: string,
    data: T[],
    batchSize: number = 1000
  ): Promise<void> {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    // Process in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchParams = batch.flatMap(row => columns.map(col => row[col]));
      
      // Create batch SQL with multiple value sets
      const batchPlaceholders = batch.map(() => `(${placeholders})`).join(', ');
      const batchSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${batchPlaceholders}`;
      
      await this.executeOptimizedQuery(batchSql, batchParams);
    }
  }

  /**
   * Optimize bulk updates
   */
  public async executeBulkUpdate<T extends Record<string, any>>(
    table: string,
    data: T[],
    keyColumn: string,
    updateColumns: string[],
    batchSize: number = 1000
  ): Promise<void> {
    if (data.length === 0) return;

    // Process in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Use CASE statements for bulk update
      const caseStatements = updateColumns.map(col => 
        `${col} = CASE ${keyColumn} ` +
        batch.map(row => `WHEN ? THEN ?`).join(' ') +
        ` END`
      ).join(', ');

      const whereClause = `${keyColumn} IN (${batch.map(() => '?').join(', ')})`;
      const sql = `UPDATE ${table} SET ${caseStatements} WHERE ${whereClause}`;

      const params: any[] = [];
      
      // Add CASE parameters
      updateColumns.forEach(col => {
        batch.forEach(row => {
          params.push(row[keyColumn], row[col]);
        });
      });
      
      // Add WHERE parameters
      batch.forEach(row => {
        params.push(row[keyColumn]);
      });

      await this.executeOptimizedQuery(sql, params);
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): QueryPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get slow queries
   */
  public getSlowQueries(threshold?: number): QueryPerformanceMetrics[] {
    const limit = threshold || this.slowQueryThreshold;
    return this.performanceMetrics.filter(metric => metric.executionTime > limit);
  }

  /**
   * Clear performance metrics
   */
  public clearMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Analyze query performance
   */
  public async analyzeQuery(sql: string): Promise<any> {
    const explainSql = `EXPLAIN ${sql}`;
    return await this.executeOptimizedQuery(explainSql);
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: QueryPerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Optimize database indexes
   */
  public async optimizeIndexes(): Promise<void> {
    const tables = ['projects', 'tasks', 'task_tags', 'time_sessions', 'estimation_history'];
    
    for (const table of tables) {
      await this.executeOptimizedQuery(`OPTIMIZE TABLE ${table}`);
    }
  }

  /**
   * Get database statistics
   */
  public async getDatabaseStats(): Promise<any> {
    const stats = await this.executeOptimizedQuery(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        (data_length + index_length) as total_size
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY total_size DESC
    `);
    
    return stats;
  }
}
