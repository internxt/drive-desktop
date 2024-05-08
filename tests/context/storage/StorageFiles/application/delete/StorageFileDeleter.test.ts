import { StorageFileDeleter } from '../../../../../../src/context/storage/StorageFiles/application/delete/StorageFileDeleter';
import { SingleFileMatchingFinderTestClass } from '../../../../virtual-drive/files/__test-class__/SingleFileMatchingFinderTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { StorageFileCacheMock } from '../../__mocks__/StorageFileCacheMock';
import { StorageFilesRepositoryMock } from '../../__mocks__/StorageFilesRepositoryMock';
import { StorageFileIdMother } from '../../domain/StorageFileIdMother';
import { StorageFileMother } from '../../domain/StorageFileMother';

describe('Storage File Deleter', () => {
  let SUT: StorageFileDeleter;

  let repository: StorageFilesRepositoryMock;
  let virtualFileFinder: SingleFileMatchingFinderTestClass;
  let storageFileCache: StorageFileCacheMock;

  beforeAll(() => {
    repository = new StorageFilesRepositoryMock();
    virtualFileFinder = new SingleFileMatchingFinderTestClass();
    storageFileCache = new StorageFileCacheMock();

    SUT = new StorageFileDeleter(
      repository,
      virtualFileFinder,
      storageFileCache
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does nothing if the file is not found', async () => {
    const file = FileMother.any();
    virtualFileFinder.finds(file);
    repository.shouldBeEmpty();

    await SUT.run(file.path);

    repository.assertDeleteHasNotBeenCalled();
  });

  it('deletes the contents from the repository if found', async () => {
    const file = FileMother.any();
    const storageFile = StorageFileMother.random();
    virtualFileFinder.finds(file);
    repository.shouldExists([
      { id: StorageFileIdMother.random(), value: true },
    ]);

    repository.shouldRetrieve(storageFile);

    await SUT.run(file.path);

    repository.assertDeleteHasBeenCalledWith([[storageFile.id]]);
  });

  it('deletes it from cache is present', async () => {
    const file = FileMother.any();
    const storageFile = StorageFileMother.random();
    virtualFileFinder.finds(file);
    repository.shouldExists([
      { id: StorageFileIdMother.random(), value: true },
    ]);

    repository.shouldRetrieve(storageFile);
    storageFileCache.doesHave(storageFile.id);

    await SUT.run(file.path);

    storageFileCache.assertDeleteHasBeenCalledWith(storageFile.id);
  });
});
