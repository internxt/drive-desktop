import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { rename, stat } from '@/infra/file-system/original-fs';
import { Addon } from '@/node-win/addon-wrapper';
import { FileExplorerItem } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { clearMoveAttempts, MAX_MOVE_ATTEMPTS, trackMoveAttempt } from '../unreconciled-folders';
import { needsToBeMoved } from './needs-to-be-moved';

type Props = {
  ctx: SyncContext;
  type: 'file' | 'folder';
  remote: ExtendedDriveFile | ExtendedDriveFolder;
  local: FileExplorerItem;
};

export async function checkIfMoved({ ctx, type, remote, local }: Props) {
  const isMoved = needsToBeMoved({ remote, local });

  if (!isMoved) {
    clearMoveAttempts({ uuid: remote.uuid });
    return true;
  }

  const remotePath = remote.absolutePath;
  const localPath = local.path;

  if (await isTakenByAnotherItem({ localPath, remotePath })) {
    ctx.logger.warn({ msg: 'Placeholder move target is taken by another item', type, localPath, remotePath });
    return false;
  }

  /**
   * v2.6.13 Victor Fernandez
   * `rename` can return without throwing and still leave the item where it was, so the only way
   * to know that the previous move worked is that this one is no longer requested. Asking for the
   * same origin and destination again means it did not, and retrying forever burns the CPU while
   * leaving the local tree silently out of sync with the remote one.
   */
  const { attempts } = trackMoveAttempt({ uuid: remote.uuid, from: localPath, to: remotePath });

  if (attempts > MAX_MOVE_ATTEMPTS) {
    ctx.logger.warn({ msg: 'Placeholder move does not converge', type, localPath, remotePath, attempts });
    return false;
  }

  ctx.logger.debug({ msg: 'Moving placeholder', type, localPath, remotePath });
  await rename(localPath, remotePath);
  await Addon.updateSyncStatus({ path: remotePath });
  return true;
}

/**
 * v2.7.4 Victor Fernandez
 * `rename` silently overwrites the target. File ids are compared instead of checking if the target exists so that
 * case-only renames still work, and as bigint because they can exceed the Number precision.
 */
async function isTakenByAnotherItem({ localPath, remotePath }: { localPath: AbsolutePath; remotePath: AbsolutePath }) {
  try {
    const [local, remote] = await Promise.all([stat(localPath, { bigint: true }), stat(remotePath, { bigint: true })]);
    return local.ino !== remote.ino;
  } catch {
    return false;
  }
}
