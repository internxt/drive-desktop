import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

@Service()
export class FolderRepositoryInitializer {
  constructor(private readonly repository: FolderRepository) {}

  async run(folders: Array<Folder>): Promise<void> {
    const addPromises = folders.map((folder: Folder) =>
      this.repository.add(folder)
    );

    await Promise.all(addPromises);
  }
}
