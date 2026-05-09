import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { Lmdb } from '@/infra/lmdb/lmdb';
import { Addon } from '@/node-win/addon-wrapper';
import { checkIfMoved } from './check-if-moved';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFolder;
};

export async function updateFolderPlaceholder({ ctx, remote }: Props) {
  const path = remote.absolutePath;

  try {
    const { isValid } = validateWindowsName({ path, name: remote.name });
    if (!isValid) return false;

    const local = Lmdb.getFolder(remote.uuid);

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
    return false;
  }
}
