import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FileSyncStatusUpdater {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  run(file: File) {
    this.localFileSystem.updateSyncStatus(file);
  }
}
