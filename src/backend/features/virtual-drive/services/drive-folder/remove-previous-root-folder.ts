import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { rm } from 'node:fs/promises';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { PATHS } from '../../../../../core/electron/paths';

const execFileAsync = promisify(execFile);

type Props = {
  oldPath: string;
  newPath: string;
};

export async function removePreviousRootFolder({ oldPath, newPath }: Props) {
  const oldPathSafe = oldPath.trim();
  if (!oldPathSafe) return;

  const resolvedOldPath = resolve(oldPathSafe);
  const resolvedNewPath = resolve(newPath);
  const resolvedHomePath = resolve(PATHS.HOME_FOLDER_PATH);

  if (resolvedOldPath === resolvedNewPath) return;

  if (resolvedOldPath === '/' || resolvedOldPath === resolvedHomePath) {
    logger.warn({ msg: '[VIRTUAL DRIVE] skipping previous root folder deletion due to unsafe path', oldPath });
    return;
  }

  await releaseStaleFuseMount(resolvedOldPath);

  try {
    await rm(resolvedOldPath, { recursive: true, force: true });
    logger.debug({ msg: '[VIRTUAL DRIVE] previous root folder removed', oldPath: resolvedOldPath });
  } catch (error) {
    logger.error({ msg: '[VIRTUAL DRIVE] failed removing previous root folder', error, oldPath: resolvedOldPath });
  }
}

/**
 * Releases a stale FUSE mount at the given path using a lazy unmount.
 * The daemon may have exited without cleanly unmounting (e.g. open file handles),
 * leaving the kernel mount entry in a disconnected (ENOTCONN) state.
 * fusermount3 -uz detaches the mount even when the filesystem is busy.
 */
async function releaseStaleFuseMount(mountPath: string): Promise<void> {
  try {
    await execFileAsync('fusermount3', ['-uz', mountPath]);
    logger.debug({ msg: '[VIRTUAL DRIVE] stale fuse mount released', mountPath });
  } catch {
    // Not a FUSE mount point or already unmounted — proceed.
  }
}
