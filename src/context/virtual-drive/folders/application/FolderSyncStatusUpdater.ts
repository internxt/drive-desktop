import { Folder } from '../domain/Folder';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class FolderSyncStatusUpdater {
  constructor(private readonly localFileSystem: LocalFileSystem) {}

  async run(folder: Folder) {
    await this.localFileSystem.updateSyncStatus(folder);
  }
}
