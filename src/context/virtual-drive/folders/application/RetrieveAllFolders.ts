import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class RetrieveAllFolders {
  constructor(private readonly repository: FolderRepository) {}

  run(): Promise<Array<Folder>> {
    return this.repository.all();
  }
}
