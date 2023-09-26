import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { PlatformPathConverter } from '../../shared/test/helpers/PlatformPathConverter';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderFinder } from './FolderFinder';
import { FolderPathFromAbsolutePathCreator } from './FolderPathFromAbsolutePathCreator';

export class FolderCreator {
  constructor(
    private readonly folderPathFromAbsolutePathCreator: FolderPathFromAbsolutePathCreator,
    private readonly repository: FolderRepository,
    private readonly folderFinder: FolderFinder,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(absolutePath: string): Promise<Folder['id']> {
    const folderPath = this.folderPathFromAbsolutePathCreator.run(absolutePath);
    this.ipc.send('CREATING_FOLDER', {
      name: folderPath.name(),
    });

    const parent = this.folderFinder.run(
      PlatformPathConverter.winToPosix(folderPath.dirname())
    );

    const folder = await this.repository.create(folderPath, parent.id);

    this.ipc.send('FOLDER_CREATED', {
      name: folderPath.name(),
    });

    return folder.id;
  }
}
