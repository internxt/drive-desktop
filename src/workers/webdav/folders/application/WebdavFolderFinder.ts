import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderFinder {
  constructor(private readonly reposiotry: WebdavFolderRepository) {}

  run(path: string): WebdavFolder {
    const folder = this.reposiotry.search(path);

    if (!folder) {
      throw new Error(`Folder ${path} not found`);
    }

    return folder;
  }
}
