import { basename } from 'path';
import { FolderPath } from '../../../context/virtual-drive/folders/domain/FolderPath';
import { FuseError, FuseUnknownError } from './FuseErrors';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';
import { SyncErrorCause } from '../../../shared/issues/SyncErrorCause';
import { Container } from 'diod';
import { SyncFileMessenger } from '../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { FolderDeleter } from '../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderPathUpdater } from '../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { SingleFolderMatchingSearcher } from '../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { SyncFolderMessenger } from '../../../context/virtual-drive/folders/domain/SyncFolderMessenger';

type RenameOrMoveRight = 'no-op' | 'success';

export class RenameMoveOrTrashFolder {
  private static readonly NO_OP: RenameOrMoveRight = 'no-op';
  private static readonly SUCCESS: RenameOrMoveRight = 'success';

  constructor(private readonly container: Container) {}

  private async trash(folder: Folder): Promise<FuseError | undefined> {
    try {
      await this.container.get(FolderDeleter).run(folder.uuid);
      return undefined;
    } catch (trowed: unknown) {
      const cause: SyncErrorCause =
        trowed instanceof DriveDesktopError ? trowed.syncErrorCause : 'UNKNOWN';

      await this.container.get(SyncFileMessenger).issues({
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
    const folder = await this.container.get(SingleFolderMatchingSearcher).run({
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

      await this.container
        .get(SyncFolderMessenger)
        .rename(folder.name, desiredPath.name());

      await this.container.get(FolderPathUpdater).run(folder.uuid, dest);

      await this.container
        .get(SyncFolderMessenger)
        .renamed(folder.name, desiredPath.name());

      return right(RenameMoveOrTrashFolder.SUCCESS);
    } catch (throwed: unknown) {
      await this.container.get(SyncFolderMessenger).issue({
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
