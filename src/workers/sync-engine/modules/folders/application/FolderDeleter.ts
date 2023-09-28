import Logger from 'electron-log';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { ParentFoldersExistForDeletion } from './ParentFoldersExistForDeletion';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';

export class FolderDeleter {
  constructor(
    private readonly repository: FolderRepository,
    private readonly parentFoldersExistForDeletion: ParentFoldersExistForDeletion,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(uuid: Folder['uuid']): Promise<void> {
    const folder = this.repository.searchByPartial({ uuid });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    try {
      if (!folder.parentId) {
        throw new ActionNotPermittedError('Trash root folder');
      }

      const allParentsExists = this.parentFoldersExistForDeletion.run(
        // TODO: Create a new aggregate root for root folder so the rest have the parent Id as number
        folder.parentId as number
      );

      if (!allParentsExists) {
        Logger.warn(
          `Skipped folder deletion for ${folder.path.value}. A folder in a higher level is already marked as trashed`
        );
        return;
      }

      folder.trash();
      await this.repository.trash(folder);
    } catch (error: unknown) {
      Logger.error(`Error deleting the folder ${folder.name}: `, error);

      this.placeholderCreator.folder(folder);
    }
  }
}
