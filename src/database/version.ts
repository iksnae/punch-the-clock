// Database version management

export interface DatabaseVersion {
  version: string;
  description: string;
  releaseDate: Date;
  changes: string[];
}

export const DATABASE_VERSIONS: DatabaseVersion[] = [
  {
    version: '1.0.0',
    description: 'Initial database schema',
    releaseDate: new Date('2024-01-01'),
    changes: [
      'Created projects table',
      'Created tasks table with state management',
      'Created task_tags table for tag support',
      'Created time_sessions table for time tracking',
      'Created estimation_history table for estimation tracking',
      'Created configuration table for settings',
      'Added all necessary indexes for performance',
    ],
  },
];

export class DatabaseVersionManager {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  public async getCurrentVersion(): Promise<string> {
    try {
      const result = await this.db.executeQuery(
        "SELECT value FROM configuration WHERE key = 'database_version'"
      ) as Array<{ value: string }>;
      return result[0]?.value || '0.0.0';
    } catch (error) {
      return '0.0.0';
    }
  }

  public async setVersion(version: string): Promise<void> {
    await this.db.executeQuery(
      'INSERT INTO configuration (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      ['database_version', version, version]
    );
  }

  public async getVersionHistory(): Promise<Array<{ version: string; applied_at: Date }>> {
    try {
      const result = await this.db.executeQuery(
        'SELECT version, executed_at FROM migrations ORDER BY executed_at'
      ) as Array<{ version: string; executed_at: Date }>;
      return result.map((row: { version: string; executed_at: Date }) => ({
        version: row.version,
        applied_at: row.executed_at,
      }));
    } catch (error) {
      return [];
    }
  }

  public getVersionInfo(version: string): DatabaseVersion | undefined {
    return DATABASE_VERSIONS.find(v => v.version === version);
  }

  public async isVersionCompatible(version: string): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    return this.compareVersions(version, currentVersion) >= 0;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }
}
