import * as fs from 'fs';
import * as path from 'path';
import { Migration } from './types';
import { DatabaseConnection } from './connection';

export class DatabaseMigrator {
  private db: DatabaseConnection;
  private migrationsDir: string;

  constructor(db: DatabaseConnection) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  public async getAvailableMigrations(): Promise<Migration[]> {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(this.migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract version and name from filename (e.g., "001_initial_schema.sql")
      const [version, ...nameParts] = file.replace('.sql', '').split('_');
      const name = nameParts.join('_');

      migrations.push({
        version,
        name,
        up: content,
        down: this.generateDownMigration(content, name),
      });
    }

    return migrations;
  }

  public async getExecutedMigrations(): Promise<Migration[]> {
    try {
      const results = await this.db.executeQuery<{
        version: string;
        name: string;
        executed_at: Date;
      }>('SELECT version, name, executed_at FROM migrations ORDER BY version');

      return results.map(row => ({
        version: row.version,
        name: row.name,
        up: '',
        down: '',
        executedAt: row.executed_at,
      }));
    } catch (error) {
      // Migrations table doesn't exist yet
      return [];
    }
  }

  public async getPendingMigrations(): Promise<Migration[]> {
    const available = await this.getAvailableMigrations();
    const executed = await this.getExecutedMigrations();
    const executedVersions = new Set(executed.map(m => m.version));

    return available.filter(migration => !executedVersions.has(migration.version));
  }

  public async migrate(): Promise<void> {
    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }

    console.log('All migrations completed successfully');
  }

  public async rollback(targetVersion?: string): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    
    if (executedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    let migrationsToRollback = executedMigrations.reverse();

    if (targetVersion) {
      const targetIndex = migrationsToRollback.findIndex(m => m.version === targetVersion);
      if (targetIndex === -1) {
        throw new Error(`Target version ${targetVersion} not found`);
      }
      migrationsToRollback = migrationsToRollback.slice(0, targetIndex);
    }

    if (migrationsToRollback.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    console.log(`Rolling back ${migrationsToRollback.length} migrations`);

    for (const migration of migrationsToRollback) {
      await this.rollbackMigration(migration);
    }

    console.log('Rollback completed successfully');
  }

  public async getStatus(): Promise<{
    executed: Migration[];
    pending: Migration[];
    total: number;
  }> {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    const available = await this.getAvailableMigrations();

    return {
      executed,
      pending,
      total: available.length,
    };
  }

  private async executeMigration(migration: Migration): Promise<void> {
    console.log(`Executing migration ${migration.version}: ${migration.name}`);

    try {
      await this.db.executeTransaction(async () => {
        // Split migration into individual statements
        const statements = migration.up
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            await this.db.executeQuery(statement);
          }
        }

        // Record migration as executed
        await this.db.executeQuery(
          'INSERT INTO migrations (version, name) VALUES (?, ?)',
          [migration.version, migration.name]
        );
      });

      console.log(`Migration ${migration.version} executed successfully`);
    } catch (error) {
      console.error(`Failed to execute migration ${migration.version}:`, error);
      throw error;
    }
  }

  private async rollbackMigration(migration: Migration): Promise<void> {
    console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

    try {
      await this.db.executeTransaction(async () => {
        // Execute rollback statements if available
        if (migration.down && migration.down.trim()) {
          const statements = migration.down
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

          for (const statement of statements) {
            if (statement.trim()) {
              await this.db.executeQuery(statement);
            }
          }
        }

        // Remove migration record
        await this.db.executeQuery(
          'DELETE FROM migrations WHERE version = ?',
          [migration.version]
        );
      });

      console.log(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(`Failed to rollback migration ${migration.version}:`, error);
      throw error;
    }
  }

  private generateDownMigration(upContent: string, migrationName: string): string {
    // This is a simplified rollback generator
    // In a real implementation, you'd want more sophisticated rollback logic
    const downStatements: string[] = [];

    // Extract table names from CREATE TABLE statements
    const createTableMatches = upContent.match(/CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi);
    if (createTableMatches) {
      createTableMatches.forEach(match => {
        const tableName = match.replace(/CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+/i, '');
        downStatements.push(`DROP TABLE IF EXISTS ${tableName}`);
      });
    }

    // Extract index names from CREATE INDEX statements
    const createIndexMatches = upContent.match(/CREATE INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi);
    if (createIndexMatches) {
      createIndexMatches.forEach(match => {
        const indexName = match.replace(/CREATE INDEX\s+IF\s+NOT\s+EXISTS\s+/i, '');
        downStatements.push(`DROP INDEX IF EXISTS ${indexName}`);
      });
    }

    return downStatements.join(';\n') + ';';
  }
}
