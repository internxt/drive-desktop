import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { rename } from 'node:fs/promises';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';
import { needsToBeMoved } from './needs-to-be-moved';

type Props = {
  ctx: SyncContext;
  type: 'file' | 'folder';
  remote: ExtendedDriveFile | ExtendedDriveFolder;
  localPath: AbsolutePath;
};

export async function checkIfMoved({ ctx, type, remote, localPath }: Props) {
  const remotePath = remote.absolutePath;
  const isMoved = await needsToBeMoved({ ctx, remote, localPath });

  if (isMoved) {
    ctx.logger.debug({ msg: 'Moving placeholder', type, remotePath, localPath });
    await rename(localPath, remotePath);
    await Addon.updateSyncStatus({ path: remotePath });
  }
}
