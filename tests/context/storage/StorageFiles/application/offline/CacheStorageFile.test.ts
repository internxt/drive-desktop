import { CacheStorageFile } from '../../../../../../src/context/storage/StorageFiles/application/offline/CacheStorageFile';
import { StorageFileId } from '../../../../../../src/context/storage/StorageFiles/domain/StorageFileId';
import { SingleFileMatchingFinderTestClass } from '../../../../virtual-drive/files/__test-class__/SingleFileMatchingFinderTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { StorageFileCacheMock } from '../../__mocks__/StorageFileCacheMock';
import { StorageFileDownloaderTestClass } from '../../__test-class__/download/StorageFileDownloaderTestClass';

describe('Cache Storage File', () => {
  let SUT: CacheStorageFile;

  let cache: StorageFileCacheMock;
  let finder: SingleFileMatchingFinderTestClass;
  let downloader: StorageFileDownloaderTestClass;

  beforeAll(() => {
    cache = new StorageFileCacheMock();
    finder = new SingleFileMatchingFinderTestClass();
    downloader = new StorageFileDownloaderTestClass();

    SUT = new CacheStorageFile(finder, cache, downloader);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does nothing when the cache already has the file', async () => {
    const found = FileMother.any();
    finder.finds(found);
    cache.doesHave(new StorageFileId(found.contentsId));

    await SUT.run(found.path);

    downloader.assertHasNotBeenCalled();
  });

  it('downloads a file and pipes the stream to the cache', async () => {
    const found = FileMother.any();
    finder.finds(found);
    downloader.returnsAReadable();
    cache.beingEmpty();

    await SUT.run(found.path);

    downloader.assertHasBeenCalled();
    cache.assertPipeHasBeenCalledWith(new StorageFileId(found.contentsId));
  });
});
