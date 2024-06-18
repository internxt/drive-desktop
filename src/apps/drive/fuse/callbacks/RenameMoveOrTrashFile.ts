import { Container } from 'diod';
import path from 'path';
import { Either, left, right } from '../../../../context/shared/domain/Either';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { FileTrasher } from '../../../../context/virtual-drive/files/application/trash/FileTrasher';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/move/FilePathUpdater';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { FilePath } from '../../../../context/virtual-drive/files/domain/FilePath';
import { FileStatuses } from '../../../../context/virtual-drive/files/domain/FileStatus';
import { SyncFileMessenger } from '../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { SyncError } from '../../../../shared/issues/SyncErrorCause';
import { FuseError, FuseUnknownError } from './FuseErrors';

type RenameOrMoveRight = 'no-op' | 'success';

export class RenameMoveOrTrashFile {
  private static readonly NO_OP: RenameOrMoveRight = 'no-op';
  private static readonly SUCCESS: RenameOrMoveRight = 'success';

  constructor(private readonly container: Container) {}

  private async trash(file: File): Promise<FuseError | undefined> {
    try {
      await this.container.get(FileTrasher).run(file.contentsId);
      return undefined;
    } catch (trowed: unknown) {
      const cause: SyncError =
        trowed instanceof DriveDesktopError ? trowed.cause : 'UNKNOWN';

      await this.container.get(SyncFileMessenger).issues({
        error: 'DELETE_ERROR',
        cause,
        name: file.name,
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
    const file = await this.container.get(FirstsFileSearcher).run({
      path: src,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      return right(RenameMoveOrTrashFile.NO_OP);
    }

    if (dest.startsWith('/.Trash')) {
      const error = await this.trash(file);

      if (!error) {
        return right(RenameMoveOrTrashFile.SUCCESS);
      }

      return left(error);
    }

    try {
      const desiredPath = new FilePath(dest);

      await this.container
        .get(SyncFileMessenger)
        .renaming(file.nameWithExtension, desiredPath.nameWithExtension());

      await this.container.get(FilePathUpdater).run(file.contentsId, dest);

      await this.container
        .get(SyncFileMessenger)
        .renamed(file.nameWithExtension, desiredPath.nameWithExtension());

      return right(RenameMoveOrTrashFile.SUCCESS);
    } catch (trowed: unknown) {
      const cause: SyncError =
        trowed instanceof DriveDesktopError ? trowed.cause : 'UNKNOWN';

      await this.container.get(SyncFileMessenger).issues({
        error: 'RENAME_ERROR',
        cause,
        name: path.basename(src),
      });

      if (trowed instanceof FuseError) {
        return left(trowed);
      }

      return left(new FuseUnknownError());
    }
  }
}
