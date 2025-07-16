import { logger } from '@/apps/shared/logger/logger';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
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
  repository: InMemoryFileRepository;
};

export async function updateContentsId({ virtualDrive, stats, path, uuid, fileContentsUploader, repository }: TProps) {
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
    });

    virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });

    // TODO: repository not used
    const file = repository.searchByPartial({ uuid });
    if (file) {
      repository.updateContentsAndSize(file, contents.id, contents.size);
    }
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
