import { logger } from '@/apps/shared/logger/logger';
import { FileCreator } from '../../files/application/FileCreator';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'node:fs';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  stats: Stats;
};

export class FileCreationOrchestrator {
  static async run({ ctx, path, stats }: TProps): Promise<FileUuid> {
    const fileContents = await ContentsUploader.run({ ctx, path, stats });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File uploaded',
      path,
      contentsId: fileContents.id,
      size: fileContents.size,
    });

    const createdFile = await FileCreator.run({ ctx, path, contents: fileContents });

    return createdFile.uuid;
  }
}
