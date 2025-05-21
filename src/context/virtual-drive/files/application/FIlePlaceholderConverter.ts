import VirtualDrive from '@/node-win/virtual-drive';
import { File } from '../domain/File';

export class FilePlaceholderConverter {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  run(file: File) {
    this.virtualDrive.convertToPlaceholder({
      itemPath: file.path,
      id: file.placeholderId,
    });
  }
}
