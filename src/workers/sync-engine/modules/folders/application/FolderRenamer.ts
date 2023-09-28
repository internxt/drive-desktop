import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderRenamer {
  constructor(
    private readonly repository: FolderRepository,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    this.ipc.send('FOLDER_RENAMING', {
      oldName: folder.name,
      newName: destination.name(),
    });

    folder.rename(destination);

    await this.repository.updateName(folder);

    this.ipc.send('FOLDER_RENAMED', {
      oldName: folder.name,
      newName: destination.name(),
    });
  }
}
