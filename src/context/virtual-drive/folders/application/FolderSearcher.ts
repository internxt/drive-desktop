import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderSearcher {
  constructor(private readonly repository: FolderRepository) {}

  run(partial: Partial<FolderAttributes>): Promise<Folder | undefined> {
    const folder = this.repository.searchByPartial(partial);

    return Promise.resolve(folder);
  }
}
