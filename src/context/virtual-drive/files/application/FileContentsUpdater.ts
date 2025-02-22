import { File } from '../domain/File';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';

export class FileContentsUpdater {
  constructor(private readonly repository: InMemoryFileRepository, private readonly remote: HttpRemoteFileSystem) {}

  async run(file: File, contentsId: File['contentsId'], size: File['size']): Promise<File> {
    Logger.info('Replace', file, contentsId, size);
    await this.remote.replace(file, contentsId, size);
    Logger.info('Updated', file, contentsId, size);
    return this.repository.updateContentsAndSize(file, contentsId, size);
  }
}
