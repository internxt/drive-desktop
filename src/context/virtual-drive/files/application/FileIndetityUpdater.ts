import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FileIdentityUpdater {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  run(file: File) {
    this.localFileSystem.updateFileIdentity(file.path, file.placeholderId);
  }
}
