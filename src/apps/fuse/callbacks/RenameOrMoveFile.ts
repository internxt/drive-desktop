import path from 'path';
import { FilePath } from '../../../context/virtual-drive/files/domain/FilePath';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FileAlreadyExistsError } from '../../../context/virtual-drive/files/domain/errors/FileAlreadyExistsError';
import { ActionNotPermittedError } from '../../../context/virtual-drive/folders/domain/errors/ActionNotPermittedError';
import {
  FuseError,
  FuseInvalidArgumentError,
  FuseFileOrDirectoryAlreadyExistsError,
  FuseIOError,
} from './FuseErrors';

export class RenameOrMoveFile {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  private resolveError(
    input: { src: string; dest: string },
    err: unknown
  ): FuseError {
    if (err instanceof ActionNotPermittedError) {
      return new FuseInvalidArgumentError(input.src);
    }
    if (err instanceof FileAlreadyExistsError) {
      return new FuseFileOrDirectoryAlreadyExistsError(input.src);
    }

    return new FuseIOError(
      `Unknown error while updating the path from ${input.src} to ${input.dest}`
    );
  }

  async execute(
    src: string,
    dest: string
  ): Promise<FuseError | 'no-op' | 'success'> {
    const file = await this.container.filesSearcher.run({ path: src });

    if (!file) {
      return 'no-op';
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

      return 'success';
    } catch (err: unknown) {
      const error = this.resolveError({ src, dest }, err);

      const current = path.basename(src);
      const desired = path.basename(dest);

      await this.container.syncFileMessenger.errorWhileRenaming(
        current,
        desired,
        error.message
      );

      return error;
    }
  }
}
