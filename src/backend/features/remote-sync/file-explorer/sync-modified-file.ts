import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { File } from '@/context/virtual-drive/files/domain/File';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { Stats } from 'fs';

type Props = {
  remoteFile: File;
  localFile: { path: string; stats: Stats };
  relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter;
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFile({
  remoteFile,
  localFile,
  relativePathToAbsoluteConverter,
  fileContentsUploader,
  virtualDrive,
}: Props) {
  const remotePath = relativePathToAbsoluteConverter.run(remoteFile.path) as AbsolutePath;
  /**
   * v2.5.6 Esteban Galvis
   * Sync issues occurred due to millisecond differences in modification time,
   * causing repeated updates. To fix this, we round timestamps to seconds.
   */
  const remoteTime = Math.floor(remoteFile.modificationTime.getTime() / 1000);
  const localTime = Math.floor(localFile.stats.mtime.getTime() / 1000);

  if (localTime > remoteTime) {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File placeholder has been modified locally, updating remote',
      remotePath,
      uuid: remoteFile.uuid,
      remoteDate: remoteFile.modificationTime.toISOString(),
      localDate: localFile.stats.mtime.toISOString(),
    });

    await updateContentsId({
      virtualDrive,
      stats: localFile.stats,
      path: createRelativePath(remoteFile.path),
      uuid: remoteFile.uuid as string,
      fileContentsUploader,
    });
  }
}
