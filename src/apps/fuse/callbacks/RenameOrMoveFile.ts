import path from 'path';
import { FilePath } from '../../../context/virtual-drive/files/domain/FilePath';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';
import { SyncErrorCause } from '../../../shared/issues/SyncErrorCause';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { FuseError, FuseUnknownError } from './FuseErrors';
import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';

type RenameOrMoveRight = 'no-op' | 'success';

export class RenameOrMoveFile {
  private static readonly NO_OP: RenameOrMoveRight = 'no-op';
  private static readonly SUCCESS: RenameOrMoveRight = 'success';

  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(
    src: string,
    dest: string
  ): Promise<Either<FuseError, RenameOrMoveRight>> {
    const file = await this.container.filesSearcher.run({
      path: src,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      return right(RenameOrMoveFile.NO_OP);
    }

    try {
      const desiredPath = new FilePath(dest);

      await this.container.syncFileMessenger.renaming(
        file.nameWithExtension,
        desiredPath.nameWithExtension()
      );

      await this.container.filePathUpdater.run(file.contentsId, dest);

      await this.container.syncFileMessenger.renamed(
        file.nameWithExtension,
        desiredPath.nameWithExtension()
      );

      return right(RenameOrMoveFile.SUCCESS);
    } catch (trowed: unknown) {
      const cause: SyncErrorCause =
        trowed instanceof DriveDesktopError ? trowed.syncErrorCause : 'UNKNOWN';

      await this.container.syncFileMessenger.issues({
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
