import { StorageFileDeleter } from '../../../../../../src/context/storage/StorageFiles/application/delete/StorageFileDeleter';
import { StorageFileCache } from '../../../../../../src/context/storage/StorageFiles/domain/StorageFileCache';
import { StorageFilesRepository } from '../../../../../../src/context/storage/StorageFiles/domain/StorageFilesRepository';
import { SingleFileMatchingFinder } from '../../../../../../src/context/virtual-drive/files/application/SingleFileMatchingFinder';

export class StorageFileDeleterTestClass extends StorageFileDeleter {
  private readonly mock = jest.fn();

  constructor() {
    super(
      {} as StorageFilesRepository,
      {} as SingleFileMatchingFinder,
      {} as StorageFileCache
    );
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
