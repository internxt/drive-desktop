import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderFinder {
  constructor(private readonly repository: FolderRepository) {}

  async run(path: string): Promise<Folder> {
    const folder = await this.repository.searchByPartial({ path });

    if (!folder) {
      throw new FolderNotFoundError(path);
    }

    return folder;
  }
}
