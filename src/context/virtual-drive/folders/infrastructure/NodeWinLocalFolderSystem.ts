import VirtualDrive from '@/node-win/virtual-drive';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';

export class NodeWinLocalFolderSystem {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  createPlaceHolder(folder: Folder) {
    if (!folder.hasStatus(FolderStatuses.EXISTS)) {
      return;
    }

    this.virtualDrive.createFolderByPath({
      relativePath: folder.path,
      itemId: folder.placeholderId,
      size: 0,
      creationTime: folder.createdAt.getTime(),
      lastWriteTime: folder.updatedAt.getTime(),
    });
  }
}
