import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { RetryContentsUploader } from '@/context/virtual-drive/contents/application/RetryContentsUploader';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  virtualDrive: VirtualDrive;
  absolutePath: AbsolutePath;
  path: RelativePath;
  uuid: string;
  fileContentsUploader: RetryContentsUploader;
  repository: InMemoryFileRepository;
};

export async function updateContentsId({ virtualDrive, absolutePath, path, uuid, fileContentsUploader, repository }: TProps) {
  try {
    const { data: stats, error } = await fileSystem.stat({ absolutePath });

    if (error) throw error;

    if (stats.size === 0 || stats.size > BucketEntry.MAX_SIZE) {
      logger.warn({
        tag: 'SYNC-ENGINE',
        msg: 'Invalid file size',
        path,
        size: stats.size,
      });
      return;
    }

    const contents = await fileContentsUploader.run(path);

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
