import Logger from 'electron-log';
import { OfflineFileAttributes } from '../domain/OfflineFile';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { fileSystem } from '@/infra/file-system/file-system.module';

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
      Logger.info('Running hard update before upload');

      const { data: stats, error } = await fileSystem.stat({ absolutePath: attributes.path });
      if (error) throw error;

      const content = await this.contentsUploader.run({ path: attributes.path, stats });

      Logger.info('Running hard update after upload, Content id generated', content);

      const newContentsId = content.id;

      if (newContentsId) {
        await this.remote.deleteAndPersist({ attributes, newContentsId });
        Logger.info('Persisted new contents id', newContentsId, ' path: ', attributes.path);
      } else {
        throw new Error('Failed to upload file in hardUpdate');
      }

      return {
        path: attributes.path,
        contentsId: attributes.contentsId,
        updated: true,
      };
    } catch (error) {
      Logger.error('Error hard updating file', attributes, error);
      return {
        path: attributes.path,
        contentsId: attributes.contentsId,
        updated: false,
      };
    }
  }
}
