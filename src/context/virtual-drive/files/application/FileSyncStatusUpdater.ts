import { File } from '../domain/File';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class FileSyncStatusUpdater {
  constructor(private readonly localFileSystem: LocalFileSystem) {}

  async run(file: File) {
    await this.localFileSystem.updateSyncStatus(file);
  }
}
