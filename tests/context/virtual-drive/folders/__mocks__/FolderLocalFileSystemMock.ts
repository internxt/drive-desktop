import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { LocalFolderSystem } from '../../../../../src/context/virtual-drive/folders/domain/file-systems/LocalFolderSystem';

export class FolderLocalFileSystemMock implements LocalFolderSystem {
  public readonly createPlaceHolderMock = jest.fn();

  createPlaceHolder(folder: Folder): Promise<void> {
    return this.createPlaceHolderMock(folder);
  }
}
