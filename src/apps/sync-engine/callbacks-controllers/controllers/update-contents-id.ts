import { logger } from '@/apps/shared/logger/logger';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { Stats } from 'fs';

type TProps = {
  virtualDrive: VirtualDrive;
  stats: Stats;
  path: RelativePath;
  uuid: string;
  fileContentsUploader: ContentsUploader;
};

export async function updateContentsId({ virtualDrive, stats, path, uuid, fileContentsUploader }: TProps) {
  try {
    if (stats.size === 0 || stats.size > BucketEntry.MAX_SIZE) {
      logger.warn({
        tag: 'SYNC-ENGINE',
        msg: 'Invalid file size',
        path,
        size: stats.size,
      });
      return;
    }

    const contents = await fileContentsUploader.run({ path, stats });

    await driveServerWip.files.replaceFile({
      uuid,
      newContentId: contents.id,
      newSize: contents.size,
      modificationTime: stats.mtime,
    });

    virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error updating contents id',
      path,
      uuid,
      exc,
    });
  }
}
