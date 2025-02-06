import { File } from '../domain/File';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class FileContentsUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly remote: RemoteFileSystem
  ) {}

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
