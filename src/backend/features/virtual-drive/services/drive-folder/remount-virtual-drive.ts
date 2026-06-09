import { logger } from '@internxt/drive-desktop-core/build/backend';
import { stopVirtualDriveOnce, startVirtualDrive } from './virtual-drive.service';
import { removePreviousRootFolder } from './remove-previous-root-folder';

type Props = {
  oldPath: string;
  newPath: string;
};

export async function remountVirtualDrive({ oldPath, newPath }: Props) {
  if (oldPath === newPath) {
    logger.debug({ msg: '[VIRTUAL DRIVE] mount location unchanged, skipping remount', oldPath, newPath });
    return;
  }

  logger.debug({ msg: '[VIRTUAL DRIVE] remounting due to root folder change', oldPath, newPath });
  await stopVirtualDriveOnce();
  await removePreviousRootFolder({ oldPath, newPath });
  await startVirtualDrive();
  logger.debug({ msg: '[VIRTUAL DRIVE] remounted with new root folder', oldPath, newPath });
}
