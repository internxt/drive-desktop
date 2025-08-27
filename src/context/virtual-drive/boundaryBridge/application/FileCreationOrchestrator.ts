import { logger } from '@/apps/shared/logger/logger';
import { FileCreator } from '../../files/application/FileCreator';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'fs';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export class FileCreationOrchestrator {
  constructor(private readonly fileCreator: FileCreator) {}

  async run({ ctx, path, absolutePath, stats }: TProps): Promise<FileUuid> {
    const fileContents = await ContentsUploader.run({ ctx, absolutePath, path, stats });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File uploaded',
      path,
      contentsId: fileContents.id,
      size: fileContents.size,
    });

    const createdFile = await this.fileCreator.run({
      ctx,
      path,
      contents: fileContents,
      absolutePath,
    });

    return createdFile.uuid;
  }
}
