import { Folder } from '../domain/Folder';
import { LocalFolderSystem } from '../domain/file-systems/LocalFolderSystem';

export class FolderSyncStatusUpdater {
  constructor(private readonly localFileSystem: LocalFolderSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.updateSyncStatus(folder, true);
  }
}
