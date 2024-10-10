import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { LocalFolderSystem } from '../../../../../src/context/virtual-drive/folders/domain/file-systems/LocalFolderSystem';

export class FolderLocalFileSystemMock implements LocalFolderSystem {
  public readonly createPlaceHolderMock = jest.fn();
  public readonly getLocalFolderIdMock = jest.fn();
  public readonly updateSyncStatusMock = jest.fn();
  public readonly convertToPlaceholderMock = jest.fn();
  public readonly getPlaceholderStateMock = jest.fn();

  createPlaceHolder(folder: Folder): Promise<void> {
    return this.createPlaceHolderMock(folder);
  }
  updateSyncStatus(folder: Folder): Promise<void> {
    return this.updateSyncStatusMock(folder);
  }
  convertToPlaceholder(folder: Folder): Promise<void> {
    return this.convertToPlaceholderMock(folder);
  }
  getPlaceholderState(folder: Folder): Promise<void> {
    return this.getPlaceholderStateMock(folder);
  }
}
