// @ts-ignore this package can only be installed on win32, so in other platforms will give an ts-error
import { VirtualDrive } from 'virtual-drive/dist';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';

export class NodeWinLocalFileSystem implements LocalFileSystem {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  async createPlaceHolder(folder: Folder): Promise<void> {
    if (!folder.hasStatus(FolderStatuses.EXISTS)) {
      return;
    }

    const folderPath = `${folder.path}/`;

    this.virtualDrive.createFolderByPath(
      folderPath,
      folder.placeholderId,
      0,
      folder.createdAt.getTime(),
      folder.updatedAt.getTime()
    );
  }

  async updateSyncStatus(folder: Folder): Promise<void> {
    const folderPath = `${folder.path}/`;
    const win32AbsolutePath =
      this.relativePathToAbsoluteConverter.run(folderPath);

    return this.virtualDrive.updateSyncStatus(win32AbsolutePath, true);
  }

  async convertToPlaceholder(folder: Folder): Promise<void> {
    const folderPath = `${folder.path}/`;

    const win32AbsolutePath =
      this.relativePathToAbsoluteConverter.run(folderPath);

    return this.virtualDrive.convertToPlaceholder(
      win32AbsolutePath,
      folder.placeholderId
    );
  }
}
