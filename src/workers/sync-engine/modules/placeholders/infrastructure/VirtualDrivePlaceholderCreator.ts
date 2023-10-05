import { VirtualDrive } from 'virtual-drive/dist';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { PlaceholderCreator } from '../domain/PlaceholderCreator';
import { createFolderPlaceholderId } from '../domain/FolderPlaceholderId';
import { createFilePlaceholderId } from '../domain/FilePlaceholderId';

export class VirtualDrivePlaceholderCreator implements PlaceholderCreator {
  constructor(private readonly drive: VirtualDrive) {}

  folder(folder: Folder): void {
    const folderPath = `${folder.path.value}/`;

    const placeholderId = createFolderPlaceholderId(folder.uuid);

    this.drive.createItemByPath(folderPath, placeholderId);
  }

  file(file: File): void {
    const placeholderId = createFilePlaceholderId(file.contentsId);

    this.drive.createItemByPath(
      file.path.value,
      placeholderId,
      file.size,
      file.createdAt.getTime(),
      file.updatedAt.getTime()
    );
  }
}
