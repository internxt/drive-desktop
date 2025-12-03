import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { rename } from 'node:fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { InMemoryFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';

export class FolderPlaceholderUpdater {
  static async update({ ctx, remote, folders }: { ctx: SyncContext; remote: ExtendedDriveFolder; folders: InMemoryFolders }) {
    const path = remote.absolutePath;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const local = folders[remote.uuid];

      if (!local) {
        await Addon.createFolderPlaceholder({
          path,
          placeholderId: `FOLDER:${remote.uuid}`,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return;
      }

      const remotePath = remote.absolutePath;
      const localPath = local.path;

      if (hasToBeMoved({ ctx, remotePath, localPath })) {
        ctx.logger.debug({
          msg: 'Moving folder placeholder',
          remotePath,
          localPath,
        });

        await rename(localPath, remotePath);
        await Addon.updateSyncStatus({ path: remotePath });
      }
    } catch (exc) {
      ctx.logger.error({
        msg: 'Error updating folder placeholder',
        path,
        exc,
      });
    }
  }

  static async run({ ctx, remotes, folders }: { ctx: SyncContext; remotes: ExtendedDriveFolder[]; folders: InMemoryFolders }) {
    await Promise.all(
      remotes.map(async (remote) => {
        await this.update({ ctx, remote, folders });
      }),
    );
  }
}
