import { FolderAlreadyExists } from '../../../context/virtual-drive/folders/domain/errors/FolderAlreadyExists';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import {
  FuseFileOrDirectoryAlreadyExistsError,
  FuseError,
  FuseIOError,
  FuseInvalidArgumentError,
} from './FuseErrors';
import { FolderNotFoundError } from '../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';

export class MakeDirectoryCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Make Directory');
  }

  private resolveError(
    input: { path: string; mode: number },
    err: unknown
  ): FuseError {
    if (err instanceof FolderAlreadyExists) {
      return new FuseFileOrDirectoryAlreadyExistsError(input.path);
    }
    if (err instanceof FolderNotFoundError) {
      return new FuseInvalidArgumentError(input.path);
    }

    return new FuseIOError(
      `Unknown error while creating the folder: ${input.path}`
    );
  }

  async execute(path: string, mode: number) {
    try {
      await this.container.syncFolderMessenger.creating(path);

      await this.container.folderCreator.run(path);

      await this.container.syncFolderMessenger.created(path);

      return this.right();
    } catch (err: unknown) {
      const error = this.resolveError({ path, mode }, err);

      this.container.syncFolderMessenger.errorWhileCreating(
        path,
        'unknown error'
      );

      return this.left(error);
    }
  }
}
