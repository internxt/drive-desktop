import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { RenameOrMoveFile } from './RenameOrMoveFile';
import { RenameOrMoveFolder } from './RenameOrMoveFolder';

export class RenameOrMoveCallback extends NotifyFuseCallback {
  private readonly updateFile: RenameOrMoveFile;
  private readonly updateFolder: RenameOrMoveFolder;

  constructor(container: VirtualDriveDependencyContainer) {
    super('Rename Or Move');

    this.updateFile = new RenameOrMoveFile(container);
    this.updateFolder = new RenameOrMoveFolder(container);
  }

  async execute(src: string, dest: string) {
    const fileEither = await this.updateFile.execute(src, dest);

    if (fileEither.isLeft()) {
      return this.left(fileEither.getLeft());
    }

    if (fileEither.getRight() === 'success') {
      return this.right();
    }

    const folderEither = await this.updateFolder.execute(src, dest);

    if (folderEither.isLeft()) {
      return this.left(folderEither.getLeft());
    }

    if (folderEither.getRight() === 'success') {
      return this.right();
    }

    return this.left(new FuseNoSuchFileOrDirectoryError(src));
  }
}
