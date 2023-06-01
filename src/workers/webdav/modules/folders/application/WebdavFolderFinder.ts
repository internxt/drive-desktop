import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderFinder {
  constructor(private readonly repository: WebdavFolderRepository) {}

  run(path: string): WebdavFolder {
    const folder = this.repository.search(path);

    if (!folder) {
      throw new Error(`Folder ${path} not found`);
    }

    return folder;
  }
}
