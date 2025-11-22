import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { mkdir } from 'node:fs/promises';

export class VirtualDrive {
  static async createSyncRootFolder({ rootPath }: { rootPath: AbsolutePath }) {
    const { error } = await fileSystem.stat({ absolutePath: rootPath });

    if (error) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: error.code });
      await mkdir(rootPath, { recursive: true });
    }
  }
}
