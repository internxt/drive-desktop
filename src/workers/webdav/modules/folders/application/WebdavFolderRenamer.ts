import { WebdavIpc } from '../../../ipc';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderRenamer {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly ipc: WebdavIpc
  ) {}

  async run(folder: WebdavFolder, destination: string) {
    const path = new FolderPath(destination);

    this.ipc.send('WEBDAV_FOLDER_RENAMING', {
      oldName: folder.name,
      newName: path.name(),
    });

    folder.rename(path);

    await this.repository.updateName(folder);

    this.ipc.send('WEBDAV_FOLDER_RENAMED', {
      oldName: folder.name,
      newName: path.name(),
    });
  }
}
