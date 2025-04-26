import { VirtualDrive } from '@internxt/node-win/dist';
import { FileStatuses } from '../../files/domain/FileStatus';
import { File } from '../domain/File';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import fs from 'fs/promises';
import Logger from 'electron-log';

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

  async getFileIdentity(path: File['path']): Promise<string> {
    /*
     * v2.5.2 Jonathan Daniel
     * really needs this to be awaited
     */
    // eslint-disable-next-line @typescript-eslint/await-thenable
    return await this.virtualDrive.getFileIdentity({ path });
  }
  async deleteFileSyncRoot(path: File['path']): Promise<void> {
    await this.virtualDrive.deleteFileSyncRoot({ path });
  }

  updateSyncStatus(file: File, status = true) {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(file.path);
    return this.virtualDrive.updateSyncStatus({
      itemPath: win32AbsolutePath,
      isDirectory: false,
      sync: status,
    });
  }

  convertToPlaceholder(file: File) {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(file.path);

    return this.virtualDrive.convertToPlaceholder({
      itemPath: win32AbsolutePath,
      id: file.placeholderId,
    });
  }

  getPlaceholderStateByRelativePath(relativePath: string) {
    return this.virtualDrive.getPlaceholderState({ path: relativePath });
  }

  updateFileIdentity(path: string, newIdentity: `FILE:${string}`): void {
    this.virtualDrive.updateFileIdentity({
      itemPath: path,
      id: newIdentity,
      isDirectory: false,
    });
  }
}
