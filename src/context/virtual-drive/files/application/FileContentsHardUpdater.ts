import { OfflineFileAttributes } from '../domain/OfflineFile';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { logger } from '@/apps/shared/logger/logger';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type FileContentsHardUpdaterRun = {
  attributes: OfflineFileAttributes;
};
export class FileContentsHardUpdater {
  constructor(private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter) {}

  async run(ctx: ProcessSyncContext, input: FileContentsHardUpdaterRun) {
    const { attributes } = input;
    try {
      logger.debug({ msg: 'Running hard update before upload' });

      const { data: stats, error } = await fileSystem.stat({ absolutePath: attributes.path });
      if (error) throw error;

      const { path } = attributes;
      const win32RelativePath = PlatformPathConverter.posixToWin(path);

      const absolutePath = this.relativePathToAbsoluteConverter.run(win32RelativePath) as AbsolutePath;

      const content = await ContentsUploader.run({ ctx, path: absolutePath, stats });

      logger.debug({ msg: 'Running hard update after upload, Content id generated', content });

      const newContentsId = content.id;

      if (newContentsId) {
        await HttpRemoteFileSystem.deleteAndPersist(ctx, { attributes, newContentsId });
        logger.debug({ msg: 'Persisted new contents id', newContentsId, path: attributes.path });
      } else {
        throw new Error('Failed to upload file in hardUpdate');
      }

      return {
        path: attributes.path,
        contentsId: attributes.contentsId,
        updated: true,
      };
    } catch (error) {
      logger.error({ msg: 'Error hard updating file', inputAttributes: attributes, error });
      return {
        path: attributes.path,
        contentsId: attributes.contentsId,
        updated: false,
      };
    }
  }
}
