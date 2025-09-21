import { DatabaseService } from '../database/types';

export class TaskTagRepository {
  constructor(private db: DatabaseService) {}

  public async getTagsByTask(taskId: number): Promise<string[]> {
    const rows = await this.db.executeQuery(
      'SELECT tag FROM task_tags WHERE task_id = ? ORDER BY tag',
      [taskId]
    );
    return rows.map((row: any) => row.tag);
  }

  public async getTasksByTag(tag: string): Promise<number[]> {
    const rows = await this.db.executeQuery(
      'SELECT task_id FROM task_tags WHERE tag = ? ORDER BY task_id',
      [tag]
    );
    return rows.map((row: any) => row.task_id);
  }

  public async addTag(taskId: number, tag: string): Promise<void> {
    await this.db.executeQuery(
      'INSERT IGNORE INTO task_tags (task_id, tag) VALUES (?, ?)',
      [taskId, tag]
    );
  }

  public async removeTag(taskId: number, tag: string): Promise<void> {
    await this.db.executeQuery(
      'DELETE FROM task_tags WHERE task_id = ? AND tag = ?',
      [taskId, tag]
    );
  }

  public async clearTags(taskId: number): Promise<void> {
    await this.db.executeQuery(
      'DELETE FROM task_tags WHERE task_id = ?',
      [taskId]
    );
  }

  public async setTags(taskId: number, tags: string[]): Promise<void> {
    await this.clearTags(taskId);
    if (tags.length > 0) {
      for (const tag of tags) {
        await this.addTag(taskId, tag);
      }
    }
  }

  public async getAllTags(): Promise<string[]> {
    const rows = await this.db.executeQuery(
      'SELECT DISTINCT tag FROM task_tags ORDER BY tag'
    );
    return rows.map((row: any) => row.tag);
  }

  public async getTagsByProject(projectId: number): Promise<string[]> {
    const rows = await this.db.executeQuery(
      `SELECT DISTINCT tt.tag 
       FROM task_tags tt
       JOIN tasks t ON tt.task_id = t.id
       WHERE t.project_id = ?
       ORDER BY tt.tag`,
      [projectId]
    );
    return rows.map((row: any) => row.tag);
  }

  public async getTagStats(): Promise<Array<{ tag: string; taskCount: number }>> {
    const rows = await this.db.executeQuery(
      'SELECT tag, COUNT(*) as taskCount FROM task_tags GROUP BY tag ORDER BY taskCount DESC, tag'
    );
    return rows.map((row: any) => ({
      tag: row.tag,
      taskCount: row.taskCount,
    }));
  }

  public async getTagStatsByProject(projectId: number): Promise<Array<{ tag: string; taskCount: number }>> {
    const rows = await this.db.executeQuery(
      `SELECT tt.tag, COUNT(*) as taskCount 
       FROM task_tags tt
       JOIN tasks t ON tt.task_id = t.id
       WHERE t.project_id = ?
       GROUP BY tt.tag 
       ORDER BY taskCount DESC, tt.tag`,
      [projectId]
    );
    return rows.map((row: any) => ({
      tag: row.tag,
      taskCount: row.taskCount,
    }));
  }

  public async searchTags(query: string): Promise<string[]> {
    const rows = await this.db.executeQuery(
      'SELECT DISTINCT tag FROM task_tags WHERE tag LIKE ? ORDER BY tag',
      [`%${query}%`]
    );
    return rows.map((row: any) => row.tag);
  }

  public async tagExists(tag: string): Promise<boolean> {
    const rows = await this.db.executeQuery(
      'SELECT 1 FROM task_tags WHERE tag = ? LIMIT 1',
      [tag]
    );
    return rows.length > 0;
  }

  public async getTaskCountByTag(tag: string): Promise<number> {
    const rows = await this.db.executeQuery(
      'SELECT COUNT(*) as count FROM task_tags WHERE tag = ?',
      [tag]
    );
    return (rows[0] as any).count || 0;
  }
}
