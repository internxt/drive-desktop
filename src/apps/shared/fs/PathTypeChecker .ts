import fs from 'fs/promises';
import { logger } from '../logger/logger';

export class PathTypeChecker {
  static async isFolder(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch (error) {
      throw logger.error({
        msg: 'Error checking if path is a folder',
        path,
        exc: error,
      });
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
