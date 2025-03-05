import { File } from '../domain/File';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../infrastructure/SDKRemoteFileSystem';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';

export class FileContentsUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly remote: SDKRemoteFileSystem
  ) {}

  async hardUpdateRun(Attributes: OfflineFileAttributes, upload: (path: string) => Promise<RemoteFileContents>) {
    try {
      const content = await upload(Attributes.path);
      const newContentsId = content.id;

      if (content.id) {
        await this.remote.hardDelete(Attributes.contentsId);
        
        const offlineFile = OfflineFile.from({...Attributes, contentsId: newContentsId});
        this.remote.persist(offlineFile);
      } else {
        throw new Error('Failed to upload file in hardUpdate');
      }

      return {
        path: Attributes.path,
        contentsId: Attributes.contentsId,
        updated: true
      };
    } catch (error) {
      Logger.error('Error updating file', Attributes, error);
      return {
        path: Attributes.path,
        contentsId: Attributes.contentsId,
        updated: false
      };
    }
  }

  async run(
    file: File,
    contentsId: File['contentsId'],
    size: File['size']
  ): Promise<File> {
    Logger.info('Replace', file, contentsId, size);
    await this.remote.replace(file, contentsId, size);
    Logger.info('Updated', file, contentsId, size);
    return this.repository.updateContentsAndSize(file, contentsId, size);
  }
}
