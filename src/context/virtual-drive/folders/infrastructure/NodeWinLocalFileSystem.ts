import { VirtualDrive } from 'virtual-drive/dist';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class NodeWinLocalFileSystem implements LocalFileSystem {
  constructor(private readonly virtualDrive: VirtualDrive) {}

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
}
