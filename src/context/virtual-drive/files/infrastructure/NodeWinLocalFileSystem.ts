import { Service } from 'diod';
import fs from 'fs/promises';
// @ts-ignore this package can only be installed on win32, so in other platforms will give an ts-error
import { VirtualDrive } from 'virtual-drive/dist';
import { FileStatuses } from '../../files/domain/FileStatus';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { File } from '../domain/File';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

@Service()
export class NodeWinLocalFileSystem implements LocalFileSystem {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  async getLocalFileId(file: File): Promise<`${string}-${string}`> {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
      file.path
    );

    const { ino, dev } = await fs.stat(win32AbsolutePath);

    return `${dev}-${ino}`;
  }

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
