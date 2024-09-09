import { Folder } from '../domain/Folder';
import { LocalFolderSystem } from '../domain/file-systems/LocalFolderSystem';

export class FolderPlaceholderConverter {
  constructor(private readonly localFileSystem: LocalFolderSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.convertToPlaceholder(folder);
  }
}
