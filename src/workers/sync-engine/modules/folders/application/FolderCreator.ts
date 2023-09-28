import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { PlatformPathConverter } from '../../shared/test/helpers/PlatformPathConverter';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderFinder } from './FolderFinder';
import { FolderPathCreator } from './FolderPathCreator';

export class FolderCreator {
  constructor(
    private readonly folderPathFromAbsolutePathCreator: FolderPathCreator,
    private readonly repository: FolderRepository,
    private readonly folderFinder: FolderFinder,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(absolutePath: string): Promise<Folder> {
    const folderPath = this.folderPathFromAbsolutePathCreator.fromAbsolute(
      PlatformPathConverter.winToPosix(absolutePath)
    );
    this.ipc.send('FOLDER_CREATING', {
      name: folderPath.name(),
    });

    const parent = this.folderFinder.run(
      PlatformPathConverter.winToPosix(folderPath.dirname())
    );

    const folder = await this.repository.create(folderPath, parent.id);

    this.ipc.send('FOLDER_CREATED', {
      name: folderPath.name(),
    });

    return folder;
  }
}
