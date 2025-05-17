import { VirtualDrive } from '@internxt/node-win/dist';
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
