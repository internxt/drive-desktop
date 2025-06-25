import VirtualDrive from '@/node-win/virtual-drive';
import { FileStatuses } from '../../files/domain/FileStatus';
import { File } from '../domain/File';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import fs from 'fs/promises';
import Logger from 'electron-log';
import { FilePlaceholderId } from '../domain/PlaceholderId';

export class NodeWinLocalFileSystem {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  async getLocalFileId(file: File): Promise<`${string}-${string}`> {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(file.path);

    Logger.info('[getLocalFileId]: ', win32AbsolutePath);

    const { ino, dev } = await fs.stat(win32AbsolutePath);

    return `${dev}-${ino}`;
  }

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

  updateSyncStatus(file: File, status = true) {
    return this.virtualDrive.updateSyncStatus({
      itemPath: file.path,
      isDirectory: false,
      sync: status,
    });
  }

  updateFileIdentity(path: string, newIdentity: FilePlaceholderId): void {
    this.virtualDrive.updateFileIdentity({
      itemPath: path,
      id: newIdentity,
      isDirectory: false,
    });
  }
}
