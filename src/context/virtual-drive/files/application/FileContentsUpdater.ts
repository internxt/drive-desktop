import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FileContentsUpdater {
  constructor(
    private readonly repository: FileRepository,
    private readonly remote: RemoteFileSystem
  ) {}

  async run(
    file: File,
    contentsId: File['contentsId'],
    size: File['size']
  ): Promise<void> {
    await Promise.all([
      this.remote.replace(file, contentsId, size),
      this.repository.updateContentsAndSize(file, contentsId, size),
    ]);
  }
}
