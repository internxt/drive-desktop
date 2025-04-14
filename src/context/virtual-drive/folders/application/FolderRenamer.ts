import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';

export class FolderRenamer {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
    private readonly ipc: SyncEngineIpc,
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    this.ipc.send('FOLDER_RENAMING', {
      oldName: folder.name,
      newName: destination.name(),
    });

    folder.rename(destination);

    await this.remote.rename(folder);
    await this.repository.update(folder);

    this.ipc.send('FOLDER_RENAMED', {
      oldName: folder.name,
      newName: destination.name(),
    });
  }
}
