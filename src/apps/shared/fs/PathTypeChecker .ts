import fs from 'fs/promises';

export class PathTypeChecker {
  static async isFolder(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  static async isFile(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }
}
