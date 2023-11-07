import { File } from '../domain/File';
import { VirtualDrive } from 'virtual-drive/dist';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { FileStatuses } from '../../files/domain/FileStatus';

export class NodeWinLocalFileSystem implements LocalFileSystem {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  async createPlaceHolder(file: File): Promise<void> {
    if (!file.hasStatus(FileStatuses.EXISTS)) {
      return;
    }

    this.virtualDrive.createFileByPath(
      file.path,
      file.placeholderId,
      file.size,
      file.createdAt.getTime(),
      file.updatedAt.getTime()
    );
  }
}
