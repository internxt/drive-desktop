import { CacheStorageFile } from './CacheStorageFile';
import { StorageFileId } from '../../domain/StorageFileId';
import { SingleFileMatchingFinderTestClass } from '../../../../virtual-drive/files/__test-helpers__/SingleFileMatchingFinderTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/__test-helpers__/FileMother';
import { StorageFileCacheMock } from '../../__mocks__/StorageFileCacheMock';
import { StorageFileDownloaderTestClass } from '../download/__test-helpers__/StorageFileDownloaderTestClass';

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
    vi.resetAllMocks();
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
