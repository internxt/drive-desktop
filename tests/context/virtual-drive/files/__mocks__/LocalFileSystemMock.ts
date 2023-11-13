import { LocalFileSystem } from '../../../../../src/context/virtual-drive/files/domain/file-systems/LocalFileSystem';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';

export class LocalFileSystemMock implements LocalFileSystem {
  public readonly createPlaceHolderMock = jest.fn();
  public readonly getLocalFileIdMock = jest.fn();

  createPlaceHolder(file: File): Promise<void> {
    return this.createPlaceHolder(file);
  }

  getLocalFileId(file: File): Promise<`${string}-${string}`> {
    return this.getLocalFileIdMock(file);
  }
}
