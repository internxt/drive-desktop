import { LocalFileSystem } from '../../../../../src/context/virtual-drive/files/domain/file-systems/LocalFileSystem';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';

export class LocalFileSystemMock implements LocalFileSystem {
  public readonly createPlaceHolderMock = jest.fn();
  public readonly getLocalFileIdMock = jest.fn();
  public readonly updateSyncStatusMock = jest.fn();
  public readonly convertToPlaceholderMock = jest.fn();
  public readonly getPlaceholderStateMock = jest.fn();

  createPlaceHolder(file: File): Promise<void> {
    return this.createPlaceHolder(file);
  }

  getLocalFileId(file: File): Promise<`${string}-${string}`> {
    return this.getLocalFileIdMock(file);
  }

  updateSyncStatus(file: File): Promise<void> {
    throw this.updateSyncStatusMock(file);
  }

  convertToPlaceholder(file: File): Promise<void> {
    return this.convertToPlaceholder(file);
  }

  getPlaceholderState(file: File): Promise<void> {
    return this.getPlaceholderStateMock(file);
  }
}
