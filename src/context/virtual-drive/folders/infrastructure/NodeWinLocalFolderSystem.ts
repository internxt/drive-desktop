import { VirtualDrive } from '@internxt/node-win/dist';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';

export class NodeWinLocalFolderSystem {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  createPlaceHolder(folder: Folder) {
    if (!folder.hasStatus(FolderStatuses.EXISTS)) {
      return;
    }

    const folderPath = `${folder.path}/`;

    this.virtualDrive.createFolderByPath(folderPath, folder.placeholderId, 0, folder.createdAt.getTime(), folder.updatedAt.getTime());
  }

  updateSyncStatus(folder: Folder, status = true) {
    const folderPath = `${folder.path}/`;
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(folderPath);

    return this.virtualDrive.updateSyncStatus(win32AbsolutePath, true, status);
  }

  getFileIdentity(path: Folder['path']) {
    return this.virtualDrive.getFileIdentity(path);
  }
  async deleteFileSyncRoot(path: Folder['path']) {
    await this.virtualDrive.deleteFileSyncRoot(path);
  }

  convertToPlaceholder(folder: Folder) {
    const folderPath = `${folder.path}/`;

    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(folderPath);

    return this.virtualDrive.convertToPlaceholder(win32AbsolutePath, folder.placeholderId);
  }
}
