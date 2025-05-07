import { Folder } from '../domain/Folder';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FolderPlaceholderConverter {
  constructor(private readonly localFileSystem: NodeWinLocalFolderSystem) {}

  run(folder: Folder) {
    this.localFileSystem.convertToPlaceholder(folder);
  }
}
