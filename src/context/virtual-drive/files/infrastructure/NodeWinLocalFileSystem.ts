import VirtualDrive from '@/node-win/virtual-drive';
import { FileStatuses } from '../../files/domain/FileStatus';
import { File } from '../domain/File';

export class NodeWinLocalFileSystem {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  createPlaceHolder(file: File): void {
    if (!file.hasStatus(FileStatuses.EXISTS)) {
      return;
    }

    this.virtualDrive.createFileByPath({
      relativePath: file.path,
      itemId: file.placeholderId,
      size: file.size,
      creationTime: file.createdAt.getTime(),
      lastWriteTime: file.updatedAt.getTime(),
    });
  }

  getFileIdentity(path: File['path']): string {
    return this.virtualDrive.getFileIdentity({ path });
  }

  updateSyncStatus(path: string, status = true) {
    return this.virtualDrive.updateSyncStatus({
      itemPath: path,
      isDirectory: false,
      sync: status,
    });
  }
}
