import { Folder } from '../domain/Folder';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class FolderPlaceholderConverter {
  constructor(private readonly localFileSystem: LocalFileSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.convertToPlaceholder(folder);
  }
}
