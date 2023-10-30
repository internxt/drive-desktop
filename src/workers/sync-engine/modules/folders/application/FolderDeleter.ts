import Logger from 'electron-log';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { AllParentFoldersStatusIsExists } from './AllParentFoldersStatusIsExists';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import { FolderInternxtFileSystem } from '../domain/FolderInternxtFileSystem';

export class FolderDeleter {
  constructor(
    private readonly fileSystem: FolderInternxtFileSystem,
    private readonly repository: FolderRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(uuid: Folder['uuid']): Promise<void> {
    const folder = await this.repository.searchByPartial({ uuid });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    try {
      const allParentsExists = this.allParentFoldersStatusIsExists.run(
        folder.parentId
      );

      if (!allParentsExists) {
        Logger.warn(
          `Skipped folder deletion for ${folder.path.value}. A folder in a higher level is already marked as trashed`
        );
        return;
      }

      folder.trash();

      await this.fileSystem.trash(folder);
      await this.repository.delete(folder);
    } catch (error: unknown) {
      Logger.error(`Error deleting the folder ${folder.name}: `, error);

      this.placeholderCreator.folder(folder);
    }
  }
}
