import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { rm } from 'node:fs/promises';
import { InMemoryFiles, InMemoryFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import trash from 'trash';

type FileProps = { type: 'file'; remote: ExtendedDriveFile; locals: InMemoryFiles };
type FolderProps = { type: 'folder'; remote: ExtendedDriveFolder; locals: InMemoryFolders };
type Props = { ctx: SyncContext } & (FileProps | FolderProps);

export async function deleteItemPlaceholder({ ctx, type, remote, locals }: Props) {
  try {
    const local = (locals as Map<string, { path: AbsolutePath }>).get(remote.uuid);

    if (!local) return;

    if (local.path !== remote.absolutePath) {
      /**
       * v2.6.4 Daniel Jiménez
       * If we reach this point, it means we had an inconsistency between remote and local,
       * so instead of deleting the placeholder, we are going to send the item to the trash
       * so the user can decide whether to delete it or retrieve it.
       */

      ctx.logger.error({
        msg: 'Path does not match when deleting placeholder',
        remotePath: remote.absolutePath,
        localPath: local.path,
        type,
      });

      await trash(local.path);
      return;
    }

    ctx.logger.debug({ msg: 'Delete placeholder', path: remote.absolutePath, type });
    await rm(remote.absolutePath, { recursive: true, force: true });
  } catch (error) {
    ctx.logger.error({
      msg: 'Error deleting placeholder',
      path: remote.absolutePath,
      type,
      error,
    });
  }
}
