import { logger } from '@/apps/shared/logger/logger';
import { FileCreator } from '../../files/application/FileCreator';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePath } from '../../files/domain/FilePath';
import { Stats } from 'fs';
import { ContentsUploader } from '../../contents/application/ContentsUploader';

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

  async run({ path, stats }: TProps) {
    const filePath = new FilePath(path);

    const fileContents = await this.contentsUploader.run({ path, stats });

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
