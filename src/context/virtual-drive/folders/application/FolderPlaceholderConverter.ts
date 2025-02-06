import { Folder } from '../domain/Folder';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FolderPlaceholderConverter {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.convertToPlaceholder(folder);
  }
}
