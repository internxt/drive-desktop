import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { logger } from '@/apps/shared/logger/logger';
import { ExtendedDriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rename } from 'fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { InMemoryFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

export class FilePlaceholderUpdater {
  static async update({ ctx, remote, files }: { ctx: ProcessSyncContext; remote: ExtendedDriveFile; files: InMemoryFiles }) {
    const { path } = remote;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const remotePath = remote.absolutePath;
      const localPath = files[remote.uuid as FileUuid];

      if (!localPath) {
        ctx.virtualDrive.createFileByPath({
          itemPath: path,
          itemId: `FILE:${remote.uuid}`,
          size: remote.size,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return;
      }

      if (hasToBeMoved({ ctx, remotePath, localPath: localPath.absolutePath })) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Moving file placeholder',
          remotePath,
          localPath: localPath.absolutePath,
        });

        await rename(localPath.absolutePath, remotePath);
      }

      await syncRemoteChangesToLocal({
        virtualDrive: ctx.virtualDrive,
        local: localPath,
        remote,
      });
    } catch (exc) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error updating file placeholder',
        path,
        exc,
      });
    }
  }

  static async run({ ctx, remotes, files }: { ctx: ProcessSyncContext; remotes: ExtendedDriveFile[]; files: InMemoryFiles }) {
    const promises = remotes.map((remote) => this.update({ ctx, remote, files }));
    await Promise.all(promises);
  }
}
