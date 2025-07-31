import { Service } from 'diod';
import { Folder } from '../../domain/Folder';
import { FolderRepository } from '../../domain/FolderRepository';

@Service()
export class FolderRepositorySynchronizer {
  constructor(private readonly repository: FolderRepository) {}

  async clear(): Promise<void> {
    await this.repository.clear();
  }

  async run(remoteFolders: Array<Folder>): Promise<void> {
    const currentFolders = await this.repository.all();

    const remoteFoldersIds = new Set(remoteFolders.map((folder) => folder.id));

    const foldersToDelete = currentFolders.filter((folder: Folder) => {
      return !folder.isRoot() && !remoteFoldersIds.has(folder.id);
    });

    const addPromises = remoteFolders.map((folder: Folder) =>
      this.repository.add(folder)
    );

    const deletePromises = foldersToDelete.map((folder: Folder) =>
      this.repository.delete(folder.id)
    );

    await Promise.all([...addPromises, ...deletePromises]);
  }
}
