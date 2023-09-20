import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class WebdavFolderDeleter {
  constructor(private readonly repository: FolderRepository) {}

  async run(folder: Folder): Promise<void> {
    folder.trash();
    await this.repository.trash(folder);
  }
}
