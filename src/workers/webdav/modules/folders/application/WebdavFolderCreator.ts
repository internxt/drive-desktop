import { WebdavIpc } from '../../../ipc';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import { WebdavFolderFinder } from './WebdavFolderFinder';

export class WebdavFolderCreator {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly ipc: WebdavIpc
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
