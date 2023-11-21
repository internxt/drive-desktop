import { FilePath } from '../../files/domain/FilePath';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderFinder {
  constructor(private readonly repository: FolderRepository) {}

  run(path: string): Folder {
    const folder = this.repository.searchByPartial({ path });

    if (!folder) {
      throw new FolderNotFoundError(path);
    }

    return folder;
  }

  findFromFilePath(path: FilePath): Folder {
    const folder = this.repository.searchByPartial({ path: path.dirname() });

    if (!folder) {
      throw new FolderNotFoundError(path.dirname());
    }

    return folder;
  }
}
