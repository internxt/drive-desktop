import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';

export class FolderRenamer {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly ipc: SyncEngineIpc
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
