import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { Addon } from '@/node-win/addon-wrapper';
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

    if (type === 'file') {
      await rm(local.path);
      return;
    }

    let nonPlaceholderItem: string | undefined;

    const time = await measurePerfomance(async () => {
      nonPlaceholderItem = await Addon.getFirstNonPlaceholder({ parentPath: local.path });
    });

    if (nonPlaceholderItem) {
      ctx.logger.debug({ msg: 'Folder cannot be deleted because it contains a non placeholder item', time, nonPlaceholderItem });
      return;
    } else {
      ctx.logger.debug({ msg: 'Folder can be deleted, all items are placeholders', time });
    }

    /**
     * v2.6.9 Daniel Jiménez
     * We have tried with different approaches and all of them have pros and cons. The main con
     * of `rm` and `trash` is that they generate a `delete` event for every item inside the
     * folder we are trying to delete. This is not a problem with 5 items, but with folders that
     * have more than 5k items events can be delayed in the watcher which can lead to unexpected
     * delete operations and they also freeze the app. So, the solution is to move the folder to a
     * tmp folder and then delete there. We will receive just one `delete` event of the root.
     * */
    const volumeRoot = parse(local.path).root;
    const trashDir = join(volumeRoot, '.internxt-trash');
    await mkdir(trashDir, { recursive: true });
    const trashPath = join(trashDir, randomUUID());
    // Move operations are not allowed across different volumes.
    await rename(local.path, trashPath);
    await rm(trashPath, { recursive: true, force: true });
  } catch (error) {
    ctx.logger.error({ msg: 'Error deleting placeholder', path: remote.absolutePath, type, error });
  }
}
