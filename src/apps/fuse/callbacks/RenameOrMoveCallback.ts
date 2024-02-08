import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
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
    const fileResult = await this.updateFile.execute(src, dest);

    if (fileResult instanceof FuseError) {
      return this.left(fileResult);
    }

    if (fileResult === 'success') {
      return this.right();
    }

    const folderResult = await this.updateFolder.execute(src, dest);

    if (folderResult instanceof FuseError) {
      return this.left(folderResult);
    }

    if (folderResult === 'success') {
      return this.right();
    }

    return this.left(
      new FuseNoSuchFileOrDirectoryError(
        `File or folder not found when trying to change a path, src: ${src}, dest: ${dest}`
      )
    );
  }
}
