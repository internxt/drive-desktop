import { basename } from 'path';
import { FolderPath } from '../../../context/virtual-drive/folders/domain/FolderPath';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseError, FuseUnknownError } from './FuseErrors';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';
import { SyncErrorCause } from '../../../shared/issues/SyncErrorCause';

type RenameOrMoveRight = 'no-op' | 'success';

export class RenameMoveOrTrashFolder {
  private static readonly NO_OP: RenameOrMoveRight = 'no-op';
  private static readonly SUCCESS: RenameOrMoveRight = 'success';

  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  private async trash(folder: Folder): Promise<FuseError | undefined> {
    try {
      await this.container.folderDeleter.run(folder.uuid);
      return undefined;
    } catch (trowed: unknown) {
      const cause: SyncErrorCause =
        trowed instanceof DriveDesktopError ? trowed.syncErrorCause : 'UNKNOWN';

      await this.container.syncFileMessenger.issues({
        error: 'DELETE_ERROR',
        cause,
        name: folder.name,
      });

      if (trowed instanceof FuseError) {
        return trowed;
      }

      return new FuseUnknownError();
    }
  }

  async execute(
    src: string,
    dest: string
  ): Promise<Either<FuseError, RenameOrMoveRight>> {
    const folder = await this.container.singleFolderMatchingSearcher.run({
      path: src,
      status: FolderStatuses.EXISTS,
    });

    if (!folder) {
      return right(RenameMoveOrTrashFolder.NO_OP);
    }

    if (dest.startsWith('/.Trash')) {
      const error = await this.trash(folder);

      if (!error) {
        return right(RenameMoveOrTrashFolder.SUCCESS);
      }

      return left(error);
    }

    try {
      const desiredPath = new FolderPath(dest);

      await this.container.syncFolderMessenger.rename(
        folder.name,
        desiredPath.name()
      );

      await this.container.folderPathUpdater.run(folder.uuid, dest);

      await this.container.syncFolderMessenger.renamed(
        folder.name,
        desiredPath.name()
      );

      return right(RenameMoveOrTrashFolder.SUCCESS);
    } catch (throwed: unknown) {
      await this.container.syncFolderMessenger.issue({
        error: 'FOLDER_RENAME_ERROR',
        cause: 'UNKNOWN',
        name: basename(src),
      });

      if (throwed instanceof FuseError) {
        return left(throwed);
      }

      return left(new FuseUnknownError());
    }
  }
}
