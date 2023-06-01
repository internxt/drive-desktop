import { FolderPath } from '../domain/FolderPath';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import { WebdavFolderFinder } from './WebdavFolderFinder';

export class WebdavFolderCreator {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly folderFinder: WebdavFolderFinder
  ) {}

  async run(path: string): Promise<void> {
    const folderPath = new FolderPath(path);

    const parent = this.folderFinder.run(folderPath.dirname());

    await this.repository.create(folderPath, parent.id);
  }
}
