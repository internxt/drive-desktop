import { VirtualDrive } from '@/node-win';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { LocalFolderSystem } from '../domain/file-systems/LocalFolderSystem';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';

export class NodeWinLocalFileSystem implements LocalFolderSystem {
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

  async updateSyncStatus(folder: Folder, status = true): Promise<void> {
    const folderPath = `${folder.path}/`;
    const win32AbsolutePath =
      this.relativePathToAbsoluteConverter.run(folderPath);

    return this.virtualDrive.updateSyncStatus(win32AbsolutePath, true, status);
  }

  async getFileIdentity(path: File['path']): Promise<string> {
    return this.virtualDrive.getFileIdentity(path);
  }
  async deleteFileSyncRoot(path: File['path']): Promise<void> {
    await this.virtualDrive.deleteFileSyncRoot(path);
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

  getPlaceholderState(folder: Folder): Promise<void> {
    const folderPath = `${folder.path}/`;

    return this.virtualDrive.getPlaceholderState(folderPath);
  }
}
