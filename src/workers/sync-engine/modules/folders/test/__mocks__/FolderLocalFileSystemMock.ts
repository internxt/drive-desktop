import { Folder } from '../../domain/Folder';
import { LocalFileSystem } from '../../domain/file-systems/LocalFileSystem';

export class FolderLocalFileSystemMock implements LocalFileSystem {
  public readonly createPlaceHolderMock = jest.fn();

  createPlaceHolder(folder: Folder): Promise<void> {
    return this.createPlaceHolderMock(folder);
  }
}
