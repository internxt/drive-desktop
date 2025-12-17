import { Readable } from 'stream';
import { StorageFileCache } from '../domain/StorageFileCache';
import { StorageFileId } from '../domain/StorageFileId';

export class StorageFileCacheMock implements StorageFileCache {
  private readonly hasMock = vi.fn();
  private readonly storeMock = vi.fn();
  private readonly readMock = vi.fn();
  private readonly deleteMock = vi.fn();
  private readonly clearMock = vi.fn();
  private readonly pipeMock = vi.fn();

  has(id: StorageFileId): Promise<boolean> {
    return this.hasMock(id);
  }

  doesHave(id: StorageFileId) {
    this.hasMock.mockImplementationOnce((askedId: StorageFileId) => askedId.equals(id));
  }

  beingEmpty() {
    this.hasMock.mockResolvedValue(false);
  }

  store(id: StorageFileId, value: Buffer): Promise<void> {
    return this.storeMock(id, value);
  }

  pipe(id: StorageFileId, stream: Readable): Promise<void> {
    return this.pipeMock(id, stream);
  }

  assertPipeHasBeenCalledWith(id: StorageFileId) {
    expect(this.pipeMock).toHaveBeenCalledWith(id, expect.any(Object));
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
