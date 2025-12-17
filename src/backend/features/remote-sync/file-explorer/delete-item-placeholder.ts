import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { rm } from 'node:fs/promises';
import { InMemoryFiles, InMemoryFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { Addon } from '@/node-win/addon-wrapper';

type FileProps = { type: 'file'; remote: ExtendedDriveFile; locals: InMemoryFiles };
type FolderProps = { type: 'folder'; remote: ExtendedDriveFolder; locals: InMemoryFolders };
type Props = { ctx: SyncContext } & (FileProps | FolderProps);

export async function deleteItemPlaceholder({ ctx, type, remote, locals }: Props) {
  const local = (locals as Map<string, { path: AbsolutePath }>).get(remote.uuid);

  if (!local) return;

  if (local.path !== remote.absolutePath) {
    /**
     * v2.6.4 Daniel Jiménez
     * This is a temporary migration. Previously, we didn't remove items with mismatched paths, but
     * we are unsure how many users have been affected. For now, we will revert the placeholder
     * so the items reupload. In a few months, we will remove this and simply delete the items,
     * regardless of the path, so the remote version's state prevails.
     */

    ctx.logger.error({
      msg: 'Path does not match when removing placeholder',
      remotePath: remote.absolutePath,
      localPath: local.path,
      type,
    });

    if (type === 'folder') return;

    const { data: fileInfo, error } = await NodeWin.getFileInfo({ path: local.path });

    if (error) throw error;

    if (fileInfo.pinState === PinState.AlwaysLocal) {
      await Addon.revertPlaceholder({ path: local.path });
      return;
    }
  }

  try {
    ctx.logger.debug({ msg: 'Delete placeholder', path: remote.absolutePath });
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
