import { logger } from '@/apps/shared/logger/logger';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileCreator } from '../../files/application/FileCreator';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePath } from '../../files/domain/FilePath';

type TProps = {
  path: RelativePath;
};

export class FileCreationOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileCreator: FileCreator,
  ) {}

  async run({ path }: TProps) {
    const filePath = new FilePath(path);

    const fileContents = await this.contentsUploader.run(path);

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File uploaded',
      path,
      contentsId: fileContents.id,
      size: fileContents.size,
    });

    const createdFile = await this.fileCreator.run(filePath, fileContents);

    return createdFile.uuid;
  }
}
