import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { FileExplorerFiles, FileExplorerFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';

type FileProps = { type: 'file'; remote: ExtendedDriveFile; locals: FileExplorerFiles };
type FolderProps = { type: 'folder'; remote: ExtendedDriveFolder; locals: FileExplorerFolders };
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
       * so the user can decide whether to delete it or recover it.
       */

      ctx.logger.error({
        msg: 'Path does not match when deleting placeholder',
        remotePath: remote.absolutePath,
        localPath: local.path,
        type,
      });
    }

    ctx.logger.debug({ msg: 'Delete placeholder', path: local.path, type });
    const { default: trash } = await import('trash');
    await trash(local.path);
  } catch (error) {
    ctx.logger.error({ msg: 'Error deleting placeholder', path: remote.absolutePath, type, error });
  }
}
