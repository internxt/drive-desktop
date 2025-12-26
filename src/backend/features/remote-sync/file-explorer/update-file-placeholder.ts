import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { InMemoryFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';
import { checkIfMoved } from './check-if-moved';

export class FilePlaceholderUpdater {
  static async update({ ctx, remote, files }: { ctx: SyncContext; remote: ExtendedDriveFile; files: InMemoryFiles }) {
    const path = remote.absolutePath;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const local = files.get(remote.uuid);

      if (!local) {
        await Addon.createFilePlaceholder({
          path,
          placeholderId: `FILE:${remote.uuid}`,
          size: remote.size,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return;
      }

      await checkIfMoved({ ctx, type: 'file', remote, localPath: local.path });
      await syncRemoteChangesToLocal({ ctx, local, remote });
    } catch (exc) {
      ctx.logger.error({
        msg: 'Error updating file placeholder',
        path,
        exc,
      });
    }
  }
}
