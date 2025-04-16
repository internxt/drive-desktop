import Logger from 'electron-log';
import { OfflineFileAttributes } from '../domain/OfflineFile';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';

type FileContentsHardUpdaterRun = {
  attributes: OfflineFileAttributes;
  upload: (path: string) => Promise<RemoteFileContents>;
};
export class FileContentsHardUpdater {
  constructor(private readonly remote: HttpRemoteFileSystem) {}
  async run(input: FileContentsHardUpdaterRun) {
    const { attributes, upload } = input;
    try {
      Logger.info('Running hard update before upload');

      const content = await upload(attributes.path);

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
