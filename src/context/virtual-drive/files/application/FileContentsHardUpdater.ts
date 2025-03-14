import { File } from '../domain/File';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../infrastructure/SDKRemoteFileSystem';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { sleep } from '@/apps/main/util';

type FileContentsHardUpdaterRun = {
  Attributes: OfflineFileAttributes;
  upload: (path: string) => Promise<RemoteFileContents>;
};
export class FileContentsHardUpdater {
  constructor(private readonly remote: SDKRemoteFileSystem) {}
  async run(input: FileContentsHardUpdaterRun) {
    const { Attributes, upload } = input;
    try {
      Logger.info('Running hard update before upload');

      const content = await upload(Attributes.path);

      Logger.info('Running hard update after upload, Content id generated', content);

      const newContentsId = content.id;

      if (newContentsId) {
        await this.remote.deleteAndPersist({ attributes: Attributes, newContentsId });
        Logger.info('Persisted new contents id', newContentsId, ' path: ', Attributes.path);
      } else {
        throw new Error('Failed to upload file in hardUpdate');
      }

      return {
        path: Attributes.path,
        contentsId: Attributes.contentsId,
        updated: true,
      };
    } catch (error) {
      Logger.error('Error hard updating file', Attributes, error);
      return {
        path: Attributes.path,
        contentsId: Attributes.contentsId,
        updated: false,
      };
    }
  }
}
