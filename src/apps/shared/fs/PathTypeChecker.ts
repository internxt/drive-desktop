import { logger } from '../logger/logger';
import { fileSystem } from '@/infra/file-system/file-system.module';

export class PathTypeChecker {
  static async isFolder(absolutePath: string): Promise<boolean> {
    const { data, error } = await fileSystem.stat({ absolutePath });

    if (error) {
      throw logger.error({
        msg: 'Error checking if path is a folder',
        path: absolutePath,
        exc: error,
      });
    }

    return data.isDirectory();
  }
}
