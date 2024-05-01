import { File } from '../domain/File';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class FileIdentityUpdater {
  constructor(private readonly localFileSystem: LocalFileSystem) {}

  async run(file: File) {
    await this.localFileSystem.updateFileIdentity(file.path, file.placeholderId);
  }
}
