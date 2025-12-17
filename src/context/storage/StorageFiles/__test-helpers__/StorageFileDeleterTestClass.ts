import { StorageFileDeleter } from '../application/delete/StorageFileDeleter';
import { StorageFileCache } from '../domain/StorageFileCache';
import { StorageFilesRepository } from '../domain/StorageFilesRepository';
import { SingleFileMatchingFinder } from '../../../virtual-drive/files/application/SingleFileMatchingFinder';

export class StorageFileDeleterTestClass extends StorageFileDeleter {
  private readonly mock = vi.fn();

  constructor() {
    super({} as StorageFilesRepository, {} as SingleFileMatchingFinder, {} as StorageFileCache);
  }

  run(path: string): Promise<void> {
    return this.mock(path);
  }

  succeeds() {
    this.mock.mockReturnValue(Promise.resolve());
  }

  fails() {
    this.mock.mockReturnValue(Promise.reject());
  }

  assertHasBeenCalledWith(values: Array<string>) {
    expect(this.mock).toBeCalledTimes(values.length);
    values.forEach((value, index) => {
      expect(this.mock).nthCalledWith(index + 1, value);
    });
  }
}
