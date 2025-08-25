import { logger } from '@/apps/shared/logger/logger';
import { FileCreator } from '../../files/application/FileCreator';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'fs';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type TProps = {
  path: RelativePath;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export class FileCreationOrchestrator {
  constructor(
    private readonly contentsUploader: ContentsUploader,
    private readonly fileCreator: FileCreator,
  ) {}

  async run({ path, absolutePath, stats }: TProps): Promise<FileUuid> {
    const fileContents = await this.contentsUploader.run({ path, stats });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File uploaded',
      path,
      contentsId: fileContents.id,
      size: fileContents.size,
    });

    const createdFile = await this.fileCreator.run({
      path,
      contents: fileContents,
      absolutePath,
    });

    return createdFile.uuid as FileUuid;
  }
}
