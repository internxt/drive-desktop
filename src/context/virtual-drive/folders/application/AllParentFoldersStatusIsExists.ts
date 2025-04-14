import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';

@Service()
export class AllParentFoldersStatusIsExists {
  constructor(private readonly repository: InMemoryFolderRepository) {}

  run(id: Folder['id']): boolean {
    const folder = this.repository.searchByPartial({ id });

    if (!folder) {
      // TODO: investigate why when uploading a file in a path than previously existed returns undefined
      return true;
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
