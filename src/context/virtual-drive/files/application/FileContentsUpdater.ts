import { File } from '../domain/File';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../infrastructure/SDKRemoteFileSystem';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';

export class FileContentsUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly remote: SDKRemoteFileSystem
  ) {}

  async hardUpdateRun(Attributes: OfflineFileAttributes): Promise<void> {
    await this.remote.trash(Attributes.contentsId);

    const offlineFile = OfflineFile.from(Attributes);
    await this.remote.persist(offlineFile);
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
