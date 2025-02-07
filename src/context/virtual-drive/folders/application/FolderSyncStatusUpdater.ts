import { Folder } from '../domain/Folder';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FolderSyncStatusUpdater {
  constructor(private readonly localFileSystem: NodeWinLocalFolderSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.updateSyncStatus(folder, true);
  }
}
