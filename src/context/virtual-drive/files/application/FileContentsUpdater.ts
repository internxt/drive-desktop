import { File } from '../domain/File';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../infrastructure/SDKRemoteFileSystem';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';

export class FileContentsUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly remote: SDKRemoteFileSystem,
  ) {}

  async hardUpdateRun(file: File, upload: (path: string) => Promise<RemoteFileContents>): Promise<void> {
    // Re upload the file contents and update the file
    const { id, size } = await upload(file.path);

    // Replace the file contents and update the file size in remote
    Logger.info('Replace', file, id, size);
    await this.remote.replace(file, id, size);
    Logger.info('Updated', file, id, size);
    // Update the file contents and size in local memory
    this.repository.updateContentsAndSize(file, id, size);
  }

  async run(file: File, contentsId: File['contentsId'], size: File['size']): Promise<File> {
    Logger.info('Replace', file, contentsId, size);
    await this.remote.replace(file, contentsId, size);
    Logger.info('Updated', file, contentsId, size);
    return this.repository.updateContentsAndSize(file, contentsId, size);
  }
}
