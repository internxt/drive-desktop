import { FolderPlaceholderConverter } from '../../../../../src/context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';

export class FolderPlaceholderConverterMock extends FolderPlaceholderConverter {
  public readonly runMock = jest.fn();

  async run(folder: Folder) {
    return this.runMock(folder);
  }
}
