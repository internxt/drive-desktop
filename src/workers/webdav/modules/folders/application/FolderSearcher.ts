import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { HttpFolderRepository } from '../infrastructure/HttpFolderRepository';

export class FolderSearcher {
  constructor(private readonly repository: FolderRepository) {}

  run(): Array<Folder> {
    // TODO: avoid cast
    const repository = this.repository as HttpFolderRepository;

    return Object.values(repository.folders);
  }
}
