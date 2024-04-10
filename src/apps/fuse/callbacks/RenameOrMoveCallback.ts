import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { RenameMoveOrTrashFile } from './RenameMoveOrTrashFile';
import { RenameMoveOrTrashFolder } from './RenameMoveOrTrashFolder';
import { UploadOnRename } from './UploadOnRename';

export class RenameOrMoveCallback extends NotifyFuseCallback {
  private readonly updateFile: RenameMoveOrTrashFile;
  private readonly updateFolder: RenameMoveOrTrashFolder;
  private readonly uploadOnRename: UploadOnRename;

  constructor(
    virtual: VirtualDriveDependencyContainer,
    offline: OfflineDriveDependencyContainer
  ) {
    super('Rename Move or Trash', { input: true, output: true });

    this.updateFile = new RenameMoveOrTrashFile(virtual);
    this.updateFolder = new RenameMoveOrTrashFolder(virtual);
    this.uploadOnRename = new UploadOnRename(offline, virtual);
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

    const offlineUploadEither = await this.uploadOnRename.run(src, dest);

    if (offlineUploadEither.isLeft()) {
      return this.left(offlineUploadEither.getLeft());
    }

    if (offlineUploadEither.getRight() === 'success') {
      return this.right();
    }

    return this.left(new FuseNoSuchFileOrDirectoryError(src));
  }
}
