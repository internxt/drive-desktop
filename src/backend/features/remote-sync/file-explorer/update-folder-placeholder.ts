import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { ExtendedDriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { rename } from 'node:fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { InMemoryFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

export class FolderPlaceholderUpdater {
  static async update({ ctx, remote, folders }: { ctx: ProcessSyncContext; remote: ExtendedDriveFolder; folders: InMemoryFolders }) {
    const { path } = remote;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const remotePath = remote.absolutePath;
      const localPath = folders[remote.uuid as FolderUuid];

      if (!localPath) {
        ctx.virtualDrive.createFolderByPath({
          path: remotePath,
          placeholderId: `FOLDER:${remote.uuid}`,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return;
      }

      if (hasToBeMoved({ ctx, remotePath, localPath })) {
        ctx.logger.debug({
          msg: 'Moving folder placeholder',
          remotePath,
          localPath,
        });

        await rename(localPath, remotePath);
        ctx.virtualDrive.updateSyncStatus({ path: remotePath });
      }
    } catch (exc) {
      ctx.logger.error({
        msg: 'Error updating folder placeholder',
        path,
        exc,
      });
    }
  }

  static async run({ ctx, remotes, folders }: { ctx: ProcessSyncContext; remotes: ExtendedDriveFolder[]; folders: InMemoryFolders }) {
    await Promise.all(
      remotes.map(async (remote) => {
        if (remote.path === '/') return;
        await this.update({ ctx, remote, folders });
      }),
    );
  }
}
