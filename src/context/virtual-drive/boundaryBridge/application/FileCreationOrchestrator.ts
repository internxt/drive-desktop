import { FileCreator } from '../../files/application/FileCreator';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'node:fs';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  stats: Stats;
};

export class FileCreationOrchestrator {
  static async run({ ctx, path, stats }: TProps) {
    const { size } = stats;
    const contentsId = await ContentsUploader.run({ ctx, path, size });

    ctx.logger.debug({ msg: 'File uploaded', path, contentsId, size });

    const createdFile = await FileCreator.run({ ctx, path, contentsId, size });

    return createdFile.uuid;
  }
}
