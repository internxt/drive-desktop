import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatuses } from '../domain/FolderStatus';

export class ParentFoldersExistForDeletion {
  constructor(private readonly repository: FolderRepository) {}

  run(id: Folder['id']): boolean {
    const folder = this.repository.searchByPartial({ id });

    if (!folder) {
      throw new Error(`Folder with id ${id} was not found`);
    }

    if (!folder.hasStatus(FolderStatuses.EXISTS)) {
      return false;
    }

    if (!folder.parentId) {
      return true;
    }

    return this.run(folder.parentId);
  }
}
