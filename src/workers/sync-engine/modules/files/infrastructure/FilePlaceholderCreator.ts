import { VirtualDrive } from 'virtual-drive/dist';
import { File } from '../domain/File';

export class FilePlaceholderCreator {
  constructor(private readonly drive: VirtualDrive) {}

  run(file: File): void {
    this.drive.createItemByPath(file.path.value, file.contentsId, file.size);
  }
}
