import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { ExtendedDriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rename } from 'node:fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { InMemoryFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';

export class FilePlaceholderUpdater {
  static async update({ ctx, remote, files }: { ctx: ProcessSyncContext; remote: ExtendedDriveFile; files: InMemoryFiles }) {
    const path = remote.absolutePath;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const remotePath = remote.absolutePath;
      const localPath = files[remote.uuid as FileUuid];

      if (!localPath) {
        await Addon.createFilePlaceholder({
          path: remotePath,
          placeholderId: `FILE:${remote.uuid}`,
          size: remote.size,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return;
      }

      if (hasToBeMoved({ ctx, remotePath, localPath: localPath.path })) {
        ctx.logger.debug({
          msg: 'Moving file placeholder',
          remotePath,
          localPath: localPath.path,
        });

        await rename(localPath.path, remotePath);
        await Addon.updateSyncStatus({ path: remotePath });
      }

      await syncRemoteChangesToLocal({ ctx, local: localPath, remote });
    } catch (exc) {
      ctx.logger.error({
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
