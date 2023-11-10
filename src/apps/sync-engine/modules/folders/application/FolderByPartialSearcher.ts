import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderByPartialSearcher {
  constructor(private readonly repository: FolderRepository) {}

  run(partial: Partial<FolderAttributes>): Folder | undefined {
    return this.repository.searchByPartial(partial);
  }
}
