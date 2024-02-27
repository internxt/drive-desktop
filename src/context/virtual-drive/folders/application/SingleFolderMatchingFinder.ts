import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';

export class SingleFolderMatchingFinder {
  constructor(private readonly repository: FolderRepository) {}

  async run(partial: Partial<FolderAttributes>): Promise<Folder> {
    const folders = this.repository.matchingPartial(partial);

    if (folders.length === 0) {
      throw new FolderNotFoundError(JSON.stringify(partial));
    }

    if (folders.length > 1) {
      throw new Error('Expected to find a singular folder');
    }

    return folders[0];
  }
}
