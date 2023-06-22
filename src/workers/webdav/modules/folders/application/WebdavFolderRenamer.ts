import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderRenamer {
  constructor(private readonly repository: WebdavFolderRepository) {}

  async run(folder: WebdavFolder, destination: string) {
    const path = new FolderPath(destination);

    folder.rename(path);

    await this.repository.updateName(folder);
  }
}
