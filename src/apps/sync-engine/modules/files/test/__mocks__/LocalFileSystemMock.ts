import { File } from '../../domain/File';
import { LocalFileSystem } from '../../domain/file-systems/LocalFileSystem';

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
