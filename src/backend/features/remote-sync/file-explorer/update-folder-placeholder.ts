import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { captureSentryPlaceholderSyncError } from '@/apps/shared/sentry/sentry';
import { SyncContext } from '@/apps/sync-engine/config';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { FileExplorerFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { checkIfMoved } from './check-if-moved';

export class FolderPlaceholderUpdater {
  static async update({ ctx, remote, folders }: { ctx: SyncContext; remote: ExtendedDriveFolder; folders: FileExplorerFolders }) {
    const path = remote.absolutePath;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return false;

      const local = folders.get(remote.uuid);

      if (!local) {
        await Addon.createFolderPlaceholder({
          path,
          placeholderId: `FOLDER:${remote.uuid}`,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return true;
      }

      await checkIfMoved({ ctx, type: 'folder', remote, localPath: local.path });
      return true;
    } catch (exc) {
      ctx.logger.error({ msg: 'Error updating folder placeholder', path, exc });
      await captureSentryPlaceholderSyncError({
        error: exc,
        uuid: remote.uuid,
        type: 'folder',
        operationType: 'update',
      });
      return false;
    }
  }
}
