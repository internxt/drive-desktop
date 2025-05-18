import { VirtualDrive } from '@internxt/node-win/dist';
import { Folder } from '../domain/Folder';

export class FolderPlaceholderConverter {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  run(folder: Folder) {
    this.virtualDrive.convertToPlaceholder({
      itemPath: folder.path,
      id: folder.placeholderId,
    });
  }
}
