import VirtualDrive from '@/node-win/virtual-drive';
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
