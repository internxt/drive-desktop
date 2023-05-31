import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderDeleter {
  constructor(private readonly repository: WebdavFolderRepository) {}

  async run(folder: WebdavFolder): Promise<void> {
    // TODO: Add moveToTrash method once folders have an status property
    await this.repository.trash(folder);
  }
}
