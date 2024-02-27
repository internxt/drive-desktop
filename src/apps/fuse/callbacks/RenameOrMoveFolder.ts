import path from 'path';
import { FolderPath } from '../../../context/virtual-drive/folders/domain/FolderPath';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseError, FuseUnknownError } from './FuseErrors';
import { Either, left, right } from '../../../context/shared/domain/Either';
import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';

type RenameOrMoveRight = 'no-op' | 'success';

export class RenameOrMoveFolder {
  private static readonly NO_OP: RenameOrMoveRight = 'no-op';
  private static readonly SUCCESS: RenameOrMoveRight = 'success';

  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(
    src: string,
    dest: string
  ): Promise<Either<FuseError, RenameOrMoveRight>> {
    const folder = await this.container.singleFolderMatchingSearcher.run({
      path: src,
      status: FolderStatuses.EXISTS,
    });

    if (!folder) {
      return right(RenameOrMoveFolder.NO_OP);
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

      return right(RenameOrMoveFolder.SUCCESS);
    } catch (throwed: unknown) {
      const current = path.basename(src);
      const desired = path.basename(dest);

      await this.container.syncFolderMessenger.errorWhileRenaming(
        current,
        desired,
        'message '
      );

      if (throwed instanceof FuseError) {
        return left(throwed);
      }

      return left(new FuseUnknownError());
    }
  }
}
