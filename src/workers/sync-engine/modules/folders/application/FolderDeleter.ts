import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';

export class FolderDeleter {
  constructor(private readonly repository: FolderRepository) {}

  async run(uuid: Folder['uuid']): Promise<void> {
    const folder = this.repository.searchByPartial({ uuid });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    folder.trash();
    await this.repository.trash(folder);
  }
}
