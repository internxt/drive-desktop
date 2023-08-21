import { VirtualDriveIpc } from '../../../ipc';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { WebdavFolderFinder } from './WebdavFolderFinder';

export class WebdavFolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly ipc: VirtualDriveIpc
  ) {}

  async run(path: string): Promise<void> {
    const folderPath = new FolderPath(path);
    this.ipc.send('WEBDAV_FOLDER_CREATING', {
      name: folderPath.name(),
    });

    const parent = this.folderFinder.run(folderPath.dirname());

    await this.repository.create(folderPath, parent.id);

    this.ipc.send('WEBDAV_FOLDER_CREATED', {
      name: folderPath.name(),
    });
  }
}
