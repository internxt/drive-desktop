import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { FileExplorerFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { checkIfMoved } from './check-if-moved';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFolder;
  folders: FileExplorerFolders;
};

/**
 * Updates the local placeholder for a remote folder.
 *
 * @param remote - The remote folder whose placeholder should be updated
 * @param folders - The local folders indexed by remote UUID
 * @returns `true` if the placeholder is created or updated, `false` if the remote name is invalid or an error occurs
 */
export async function updateFolderPlaceholder({ ctx, remote, folders }: Props) {
  const path = remote.absolutePath;

  try {
    const { isValid } = validateWindowsName({ path, name: remote.name });
    if (!isValid) return false;

    const local = folders.get(remote.uuid);

    if (!local) {
      await Addon.createFolderPlaceholder({
        path,
        placeholderId: `FOLDER:${remote.uuid}`,
        creationTime: new Date(remote.creationTime).getTime(),
        lastWriteTime: new Date(remote.modificationTime).getTime(),
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
