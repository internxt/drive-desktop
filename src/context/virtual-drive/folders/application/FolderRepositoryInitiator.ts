import { Folder } from '../domain/Folder';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';

export class FolderRepositoryInitiator {
  constructor(private readonly repository: InMemoryFolderRepository) {}

  async run(folders: Array<Folder>) {
    const addPromises = folders.map((folder: Folder) => this.repository.add(folder));
    await Promise.all(addPromises);
  }
}
