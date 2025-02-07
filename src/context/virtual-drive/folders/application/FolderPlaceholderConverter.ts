import { Folder } from '../domain/Folder';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FolderPlaceholderConverter {
  constructor(private readonly localFileSystem: NodeWinLocalFolderSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.convertToPlaceholder(folder);
  }
}
