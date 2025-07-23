import { OfflineFileAttributes } from '../domain/OfflineFile';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { logger } from '@/apps/shared/logger/logger';

type FileContentsHardUpdaterRun = {
  attributes: OfflineFileAttributes;
};
export class FileContentsHardUpdater {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly contentsUploader: ContentsUploader,
  ) {}

  async run(input: FileContentsHardUpdaterRun) {
    const { attributes } = input;
    try {
      logger.debug({ msg: 'Running hard update before upload' });

      const { data: stats, error } = await fileSystem.stat({ absolutePath: attributes.path });
      if (error) throw error;

      const content = await this.contentsUploader.run({ path: attributes.path, stats });

      logger.debug({ msg: 'Running hard update after upload, Content id generated', content });

      const newContentsId = content.id;

      if (newContentsId) {
        await this.remote.deleteAndPersist({ attributes, newContentsId });
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
