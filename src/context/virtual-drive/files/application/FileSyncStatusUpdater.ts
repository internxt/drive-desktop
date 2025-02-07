import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FileSyncStatusUpdater {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  async run(file: File) {
    await this.localFileSystem.updateSyncStatus(file);
  }
}
