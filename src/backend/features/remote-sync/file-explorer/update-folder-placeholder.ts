import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { FileExplorerFolders, FileExplorerItem } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { addUnreconciledFolder, removeUnreconciledFolder } from '../unreconciled-folders';
import { checkIfMoved } from './check-if-moved';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFolder;
  folders: FileExplorerFolders;
};

export async function updateFolderPlaceholder({ ctx, remote, folders }: Props) {
  const local = folders.get(remote.uuid);
  const success = await update({ ctx, remote, local });

  /**
   * BR-2245
   * When we fail to reconcile a folder placeholder we skip its whole subtree, so from that
   * moment the local tree no longer represents the remote one. We keep track of it so that
   * we never propagate to the server a local deletion that happens inside that subtree.
   * We store the local path when we know it because that is the one the watcher reports,
   * and it can differ from the remote one, which is precisely why we failed to reconcile.
   */
  if (success) {
    removeUnreconciledFolder({ uuid: remote.uuid });
  } else {
    addUnreconciledFolder({ uuid: remote.uuid, path: local?.path ?? remote.absolutePath });
  }

  return success;
}

async function update({ ctx, remote, local }: Omit<Props, 'folders'> & { local: FileExplorerItem | undefined }) {
  const path = remote.absolutePath;

  try {
    const { isValid } = validateWindowsName({ path, name: remote.name });
    if (!isValid) return false;

    if (!local) {
      await Addon.createFolderPlaceholder({
        path,
        placeholderId: `FOLDER:${remote.uuid}`,
        creationTime: new Date(remote.createdAt).getTime(),
        lastWriteTime: new Date(remote.updatedAt).getTime(),
      });

      return true;
    }

    await checkIfMoved({ ctx, type: 'folder', remote, local });
    return true;
  } catch (error) {
    ctx.logger.sentryError({ msg: 'Error updating folder placeholder', path, error }, { uuid: remote.uuid });
    return false;
  }
}
