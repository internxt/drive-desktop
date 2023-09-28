import { VirtualDrive } from 'virtual-drive/dist';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { PlaceholderCreator } from '../domain/PlaceholderCreator';

export class VirtualDrivePlaceholderCreator implements PlaceholderCreator {
  constructor(private readonly drive: VirtualDrive) {}

  folder(folder: Folder): void {
    const folderPath = `${folder.path.value}/`;

    this.drive.createItemByPath(folderPath, folder.uuid);
  }

  file(file: File): void {
    this.drive.createItemByPath(
      file.path.value,
      file.contentsId,
      file.size,
      file.createdAt.getTime(),
      file.updatedAt.getTime()
    );
  }
}
