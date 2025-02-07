import Logger from 'electron-log';
import { Folder } from '../domain/Folder';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { AllParentFoldersStatusIsExists } from './AllParentFoldersStatusIsExists';
import { FolderRepository } from '../domain/FolderRepository';
import { Service } from 'diod';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

@Service()
export class FolderDeleter {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
    private readonly local: NodeWinLocalFolderSystem,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists
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

      const allParentsExists = this.allParentFoldersStatusIsExists.run(
        // TODO: Create a new aggregate root for root folder so the rest have the parent Id as number
        folder.parentId as number
      );

      if (!allParentsExists) {
        Logger.warn(
          `Skipped folder deletion for ${folder.path}. A folder in a higher level is already marked as trashed`
        );
        return;
      }

      folder.trash();

      await this.remote.trash(folder.id);
      await this.repository.update(folder);
    } catch (error: unknown) {
      Logger.error(`Error deleting the folder ${folder.name}: `, error);
      this.local.createPlaceHolder(folder);
    }
  }
}
