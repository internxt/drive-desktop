import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { Stats } from 'fs';

type Props = {
  remoteFile: DriveFile;
  localFile: { path: string; stats: Stats };
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFile({ remoteFile, localFile, fileContentsUploader, virtualDrive }: Props) {
  /**
   * v2.5.6 Esteban Galvis
   * Sync issues occurred due to millisecond differences in modification time,
   * causing repeated updates. To fix this, we round timestamps to seconds.
   */
  const remoteDate = new Date(remoteFile.modificationTime);
  const roundRemoteTime = Math.floor(remoteDate.getTime() / 1000);
  const roundLocalTime = Math.floor(localFile.stats.mtime.getTime() / 1000);

  if (roundLocalTime > roundRemoteTime && localFile.stats.size !== remoteFile.size) {
    const fileRelativePath = pathUtils.absoluteToRelative({ base: virtualDrive.syncRootPath, path: localFile.path as AbsolutePath });
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File placeholder has been modified locally, updating remote',
      path: fileRelativePath,
      uuid: remoteFile.uuid,
      remoteDate: remoteFile.modificationTime,
      localDate: localFile.stats.mtime.toISOString(),
    });

    await updateContentsId({
      virtualDrive,
      stats: localFile.stats,
      path: fileRelativePath,
      uuid: remoteFile.uuid as string,
      fileContentsUploader,
    });
  }
}
