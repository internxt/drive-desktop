import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatuses } from '../domain/FolderStatus';

export class AllParentFoldersStatusIsExists {
  constructor(private readonly repository: FolderRepository) {}

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
