import path from 'path';
import { FolderPath } from '../../../context/virtual-drive/folders/domain/FolderPath';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import {
  FuseError,
  FuseIOError,
  FuseInvalidArgumentError,
  FuseNoSuchFileOrDirectoryError,
} from './FuseErrors';
import { InvalidArgumentError } from '../../../context/shared/domain/InvalidArgumentError';
import { FolderNotFoundError } from '../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { PathHasNotChangedError } from '../../../context/virtual-drive/folders/domain/errors/PathHasNotChangedError';

export class RenameOrMoveFolder {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  private resolverError(input: { src: string; dest: string }, err: unknown) {
    if (err instanceof InvalidArgumentError) {
      return FuseInvalidArgumentError.translate(err);
    }

    if (err instanceof FolderNotFoundError) {
      return FuseNoSuchFileOrDirectoryError.translate(err);
    }

    if (err instanceof PathHasNotChangedError) {
      return FuseInvalidArgumentError.translate(err);
    }

    return new FuseIOError(
      `Unknown error while updating the path from ${input.src} to ${input.dest}`
    );
  }

  async execute(
    src: string,
    dest: string
  ): Promise<FuseError | 'no-op' | 'success'> {
    const folder = await this.container.folderSearcher.run({ path: src });

    if (!folder) {
      return 'no-op';
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

      return 'success';
    } catch (err: unknown) {
      const error = this.resolverError({ src, dest }, err);

      const current = path.basename(src);
      const desired = path.basename(dest);

      await this.container.syncFolderMessenger.errorWhileRenaming(
        current,
        desired,
        error.message
      );

      return error;
    }
  }
}
