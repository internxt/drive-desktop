import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { RetryContentsUploader } from '@/context/virtual-drive/contents/application/RetryContentsUploader';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

type TProps = {
  absolutePath: AbsolutePath;
  path: RelativePath;
  uuid: string;
  fileContentsUploader: RetryContentsUploader;
  repository: InMemoryFileRepository;
};

export async function updateContentsId({ path, uuid, fileContentsUploader, repository }: TProps) {
  try {
    // TODO: repository not used
    const file = repository.searchByPartial({ uuid });

    const contents = await fileContentsUploader.run(path);

    await driveServerWip.files.replaceFile({
      uuid,
      newContentId: contents.id,
      newSize: contents.size,
    });

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
