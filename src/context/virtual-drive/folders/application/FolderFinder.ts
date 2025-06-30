import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { Folder } from '../domain/Folder';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';

export class FolderFinder {
  constructor(private readonly repository: InMemoryFolderRepository) {}

  run(path: string): Folder {
    const folder = this.repository.searchByPartial({ path });

    if (!folder) {
      throw new FolderNotFoundError(path);
    }

    return folder;
  }

  findFromId(id: Folder['id']): Folder {
    const folder = this.repository.searchByPartial({ id });
    if (!folder) {
      throw new Error('Folder not found');
    }
    return folder;
  }
  findFromUuid(uuid: Folder['uuid']): Folder {
    const folder = this.repository.searchByPartial({ uuid });
    if (!folder) {
      throw new Error('Folder not found');
    }
    return folder;
  }
}
