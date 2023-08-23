import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class WebdavFolderFinder {
  constructor(private readonly repository: FolderRepository) {}

  run(path: string): Folder {
    const folder = this.repository.search(path);

    if (!folder) {
      throw new FolderNotFoundError(path);
    }

    return folder;
  }
}
