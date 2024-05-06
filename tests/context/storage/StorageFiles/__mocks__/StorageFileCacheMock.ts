import { StorageFileCache } from '../../../../../src/context/storage/StorageFiles/domain/StorageFileCache';
import { StorageFileId } from '../../../../../src/context/storage/StorageFiles/domain/StorageFileId';

export class StorageFileCacheMock implements StorageFileCache {
  private readonly hasMock = jest.fn();
  private readonly storeMock = jest.fn();
  private readonly readMock = jest.fn();
  private readonly deleteMock = jest.fn();
  private readonly clearMock = jest.fn();

  has(id: StorageFileId): Promise<boolean> {
    return this.hasMock(id);
  }

  shouldHave(id: StorageFileId) {
    this.hasMock.mockReturnValueOnce(id);
  }

  store(id: StorageFileId, value: Buffer): Promise<void> {
    return this.storeMock(id, value);
  }

  read(id: StorageFileId): Promise<Buffer> {
    return this.readMock(id);
  }

  delete(id: StorageFileId): Promise<void> {
    return this.deleteMock(id);
  }

  assertDeleteHasBeenCalledWith(id: StorageFileId) {
    expect(this.deleteMock).toHaveBeenLastCalledWith(id);
  }

  clear(): Promise<void> {
    return this.clearMock();
  }
}
