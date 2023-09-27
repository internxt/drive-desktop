import { VirtualDrive } from 'virtual-drive/dist';
import { Folder } from '../domain/Folder';

export class FolderPlaceholderCreator {
  constructor(private readonly drive: VirtualDrive) {}

  run(folder: Folder): void {
    const folderPath = `${folder.path.value}/`;

    this.drive.createItemByPath(folderPath, folder.uuid);
  }
}
