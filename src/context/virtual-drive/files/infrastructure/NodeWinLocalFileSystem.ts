import { VirtualDrive } from 'virtual-drive/dist';
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

  async createPlaceHolder(file: File): Promise<void> {
    if (!file.hasStatus(FileStatuses.EXISTS)) {
      return;
    }

    this.virtualDrive.createFileByPath(file.path, file.placeholderId, file.size, file.createdAt.getTime(), file.updatedAt.getTime());
  }

  async getFileIdentity(path: File['path']): Promise<string> {
    return this.virtualDrive.getFileIdentity(path);
  }
  async deleteFileSyncRoot(path: File['path']): Promise<void> {
    await this.virtualDrive.deleteFileSyncRoot(path);
  }

  async updateSyncStatus(file: File, status = true) {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(file.path);
    return this.virtualDrive.updateSyncStatus(win32AbsolutePath, false, status);
  }

  async convertToPlaceholder(file: File) {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(file.path);

    return this.virtualDrive.convertToPlaceholder(win32AbsolutePath, file.placeholderId);
  }

  getPlaceholderStateByRelativePath(relativePath: string) {
    return this.virtualDrive.getPlaceholderState(relativePath);
  }

  async updateFileIdentity(path: string, newIdentity: `FILE:${string}`): Promise<void> {
    const isNotDirectory = true;
    return this.virtualDrive.updateFileIdentity(path, newIdentity, isNotDirectory);
  }
}
