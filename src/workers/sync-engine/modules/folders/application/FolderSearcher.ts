import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';

export class FolderSearcher {
  constructor(private readonly repository: FolderRepository) {}

  run(): Array<Folder> {
    // TODO: avoid cast
    const repository = this.repository as InMemoryFolderRepository;

    return Object.values(repository.foldersAttributes);
  }
}
