import { VirtualDrive } from 'virtual-drive/dist';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { LocalFolderSystem } from '../domain/file-systems/LocalFolderSystem';

export class NodeWinLocalFolderSystem implements LocalFolderSystem {
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
