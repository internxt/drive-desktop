import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderDeleter {
  constructor(private readonly repository: WebdavFolderRepository) {}

  async run(folder: WebdavFolder): Promise<void> {
    folder.trash();
    await this.repository.trash(folder);
  }
}
