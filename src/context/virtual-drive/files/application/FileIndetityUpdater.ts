import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FileIdentityUpdater {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  async run(file: File) {
    await this.localFileSystem.updateFileIdentity(file.path, file.placeholderId);
  }
}
