import { Service } from 'diod';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { OnlyOneFolderExpectedError } from '../domain/errors/OnlyOneFolderExpectedError';

@Service()
export class SingleFolderMatchingFinder {
  constructor(private readonly repository: FolderRepository) {}

  /**
   * @param partial a partial object of the attributes of the folder in search
   * @returns the matching folder for the given partial attributes
   * @throws an {@link OnlyOneFolderExpectedError} if it finds more than one folder
   * or a {@link FolderNotFoundError} if no folder is founded
   */
  async run(partial: Partial<FolderAttributes>): Promise<Folder> {
    const folders = this.repository.matchingPartial(partial);

    if (folders.length === 0)
      throw new FolderNotFoundError(JSON.stringify(partial));

    if (folders.length > 1) throw new OnlyOneFolderExpectedError();

    return folders[0];
  }
}
