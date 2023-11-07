import { VirtualDrive } from 'virtual-drive/dist';
import { Folder } from '../../folders/domain/Folder';
import { PlaceholderCreator } from '../domain/PlaceholderCreator';
import { createFolderPlaceholderId } from '../domain/FolderPlaceholderId';
import { FolderStatuses } from '../../folders/domain/FolderStatus';

export class VirtualDrivePlaceholderCreator implements PlaceholderCreator {
  constructor(private readonly drive: VirtualDrive) {}

  folder(folder: Folder): void {
    if (!folder.hasStatus(FolderStatuses.EXISTS)) {
      return;
    }

    const folderPath = `${folder.path}/`;

    const placeholderId = createFolderPlaceholderId(folder.uuid);

    this.drive.createFolderByPath(
      folderPath,
      placeholderId,
      0,
      folder.createdAt.getTime(),
      folder.updatedAt.getTime()
    );
  }
}
