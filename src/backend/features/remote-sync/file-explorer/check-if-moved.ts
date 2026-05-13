import { rename } from 'node:fs/promises';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';
import { FileExplorerItem } from '../sync-items-by-checkpoint/load-in-memory-paths';

type Props = {
  ctx: SyncContext;
  type: 'file' | 'folder';
  remote: ExtendedDriveFile | ExtendedDriveFolder;
  local: FileExplorerItem;
};

export async function checkIfMoved({ ctx, type, remote, local }: Props) {
  if (remote.parentUuid !== local.parentUuid) {
    const remotePath = remote.absolutePath;
    const localPath = local.path;

    ctx.logger.debug({ msg: 'Moving placeholder', type, localPath, remotePath });
    await rename(localPath, remotePath);
    await Addon.updateSyncStatus({ path: remotePath });
  }
}
