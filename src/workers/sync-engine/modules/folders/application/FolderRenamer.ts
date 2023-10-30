import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderInternxtFileSystem } from '../domain/FolderInternxtFileSystem';

export class FolderRenamer {
  constructor(
    private readonly fileSystem: FolderInternxtFileSystem,
    private readonly repository: FolderRepository,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    this.ipc.send('FOLDER_RENAMING', {
      oldName: folder.name,
      newName: destination.name(),
    });

    folder.rename(destination);

    await this.fileSystem.rename(folder);
    await this.repository.update(folder);

    this.ipc.send('FOLDER_RENAMED', {
      oldName: folder.name,
      newName: destination.name(),
    });
  }
}
