import { File } from '../../files/domain/File';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { LocalFolderSystem } from '../domain/file-systems/LocalFolderSystem';
import Logger from 'electron-log';

export class FoldersFatherSyncStatusUpdater {
  constructor(
    private readonly localFileSystem: LocalFolderSystem,
    private readonly repository: FolderRepository
  ) {}

  async run(file: File): Promise<void> {
    return this.update(file.path);
  }

  private async update(path: File['path'] | Folder['path']) {
    const posixDir = PlatformPathConverter.getFatherPathPosix(path);
    if (posixDir === '/') {
      return;
    }
    const folder = await this.repository.searchByPartial({ path: posixDir });
    if (folder) {
      Logger.debug(`Updating sync status for ${folder.path}`);
      await this.localFileSystem.updateSyncStatus(folder, true);
    }
    this.update(posixDir);
  }
}
