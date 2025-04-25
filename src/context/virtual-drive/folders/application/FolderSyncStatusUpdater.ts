import { Folder } from '../domain/Folder';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FolderSyncStatusUpdater {
  constructor(private readonly localFileSystem: NodeWinLocalFolderSystem) {}

  run(folder: Folder) {
    this.localFileSystem.updateSyncStatus(folder, true);
  }
}
