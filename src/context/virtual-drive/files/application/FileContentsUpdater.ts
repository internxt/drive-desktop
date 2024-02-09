import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import Logger from 'electron-log';

export class FileContentsUpdater {
  constructor(
    private readonly repository: FileRepository,
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
