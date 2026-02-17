import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { AllParentFoldersStatusIsExists } from './AllParentFoldersStatusIsExists';
import { addFolderToTrash } from '../../../../infra/drive-server/services/folder/services/add-folder-to-trash';

@Service()
export class FolderDeleter {
  constructor(
    private readonly repository: FolderRepository,
    private readonly local: LocalFileSystem,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
  ) {}

  async run(uuid: Folder['uuid']): Promise<void> {
    const folder = await this.repository.searchByUuid(uuid);

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    try {
      if (!folder.parentId) {
        throw new ActionNotPermittedError('Trash root folder');
      }

      const allParentsExists = await this.allParentFoldersStatusIsExists.run(
        // TODO: Create a new aggregate root for root folder so the rest have the parent Id as number
        folder.parentId as number,
      );

      if (!allParentsExists) {
        logger.warn({
          msg: `Skipped folder deletion for ${folder.path}. A folder in a higher level is already marked as trashed`,
        });
        return;
      }

      folder.trash();

      const { error } = await addFolderToTrash(folder.uuid);
      if (error) {
        logger.error({
          msg: `Error adding folder ${folder.name} to trash:`,
          error,
        });
        throw new Error('Error when deleting folder');
      }
      await this.repository.delete(folder.id);
    } catch (error: unknown) {
      logger.error({
        msg: `Error deleting the folder ${folder.name}:`,
        error,
      });

      this.local.createPlaceHolder(folder);
    }
  }
}
