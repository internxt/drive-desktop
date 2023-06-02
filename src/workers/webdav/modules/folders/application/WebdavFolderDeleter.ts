import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderDeleter {
  constructor(private readonly repository: WebdavFolderRepository) {}

  async run(folder: WebdavFolder): Promise<void> {
    await this.repository.trash(folder);
  }
}
