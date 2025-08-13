import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { Stats } from 'fs';
import { virtualDrive } from '../../dependency-injection/common/virtualDrive';

type TProps = {
  stats: Stats;
  path: RelativePath;
  absolutePath: AbsolutePath;
  uuid: string;
  fileContentsUploader: ContentsUploader;
};

export async function updateContentsId({ stats, path, absolutePath, uuid, fileContentsUploader }: TProps) {
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

    const contents = await fileContentsUploader.run({ path, absolutePath, stats });

    await driveServerWip.files.replaceFile({
      uuid,
      newContentId: contents.id,
      newSize: contents.size,
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
