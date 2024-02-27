import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { LocalFileSystem } from '../../../../../src/context/virtual-drive/folders/domain/file-systems/LocalFileSystem';

export class FolderLocalFileSystemMock implements LocalFileSystem {
  public readonly createPlaceHolderMock = jest.fn();

  createPlaceHolder(folder: Folder): Promise<void> {
    return this.createPlaceHolderMock(folder);
  }
}
