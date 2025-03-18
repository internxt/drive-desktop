import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';

export class FolderRenamer {
  constructor(
    private readonly repository: FolderRepository,
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
