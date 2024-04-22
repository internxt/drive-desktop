import { Service } from 'diod';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { OnlyOneFolderExpectedError } from '../domain/errors/OnlyOneFolderExpectedError';

@Service()
export class SingleFolderMatchingSearcher {
  constructor(private readonly repository: FolderRepository) {}

  /**
   * @param partial a partial object of the attributes of the folder in search
   * @returns the matching folder for the given partial attributes or undefined if no one matches
   * @throws an {@link OnlyOneFolderExpectedError} when it finds more than one folder
   */
  async run(partial: Partial<FolderAttributes>): Promise<Folder | undefined> {
    const folders = this.repository.matchingPartial(partial);

    if (folders.length > 1) throw new OnlyOneFolderExpectedError();

    if (folders.length === 0) return;

    return folders[0];
  }
}
