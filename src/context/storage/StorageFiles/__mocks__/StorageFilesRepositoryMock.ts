import { Readable } from 'node:stream';
import { StorageFile } from '../domain/StorageFile';
import { StorageFileId } from '../domain/StorageFileId';
import { StorageFilesRepository } from '../domain/StorageFilesRepository';

export class StorageFilesRepositoryMock implements StorageFilesRepository {
  private existsMock = vi.fn();
  private retrieveMock = vi.fn();
  private storeMock = vi.fn();
  private readMock = vi.fn();
  private deleteMock = vi.fn();
  private deleteAllMock = vi.fn();
  private allMock = vi.fn();

  async exists(id: StorageFileId): Promise<boolean> {
    return this.existsMock(id);
  }

  shouldExists(values: Array<{ id: StorageFileId; value: boolean }>): void {
    values.forEach(({ id, value }) => {
      this.existsMock(id);
      this.existsMock.mockReturnValue(value);
    });
  }

  shouldBeEmpty() {
    this.existsMock.mockReturnValue(false);
  }

  async retrieve(id: StorageFileId): Promise<StorageFile> {
    return this.retrieveMock(id);
  }

  shouldRetrieve(file: StorageFile) {
    this.retrieveMock.mockReturnValueOnce(file);
  }

  async store(file: StorageFile, readable: Readable): Promise<void> {
    return this.storeMock(file, readable);
  }

  async read(id: StorageFileId): Promise<Buffer> {
    return this.readMock(id);
  }

  async delete(id: StorageFileId): Promise<void> {
    return this.deleteMock(id);
  }

  assertDeleteHasBeenCalledWith(calls: Array<Parameters<StorageFilesRepository['delete']>>) {
    expect(this.deleteMock).toBeCalledTimes(calls.length);

    calls.forEach((parameters) => expect(this.deleteMock).toBeCalledWith(...parameters));
  }

  assertDeleteHasNotBeenCalled() {
    expect(this.deleteMock).not.toBeCalled();
  }

  async deleteAll(): Promise<void> {
    return this.deleteAllMock();
  }

  async all(): Promise<StorageFile[]> {
    return this.allMock();
  }

  returnAll(files: Awaited<ReturnType<StorageFilesRepository['all']>>) {
    this.allMock.mockReturnValueOnce(files);
  }
}
