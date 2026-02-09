import { StorageRemoteChangesSyncher } from './StorageRemoteChangesSyncher';
import { StorageFile } from '../../domain/StorageFile';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { SingleFileMatchingSearcherTestClass } from '../../../../virtual-drive/files/__test-helpers__/SingleFileMatchingSearcherTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/__test-helpers__/FileMother';
import { StorageFilesRepositoryMock } from '../../__mocks__/StorageFilesRepositoryMock';
import { StorageFileMother } from '../../../__test-helpers__/StorageFileMother';
import { StorageFileDownloaderTestClass } from '../download/__test-helpers__/StorageFileDownloaderTestClass';
import { DownloadProgressTrackerMock } from '../../__mocks__/DownloadProgressTrackerMock';

describe('Storage Remote Changes Syncher', () => {
  let SUT: StorageRemoteChangesSyncher;

  let repository: StorageFilesRepositoryMock;
  let singleFileMatchingSearcher: SingleFileMatchingSearcherTestClass;
  let storageFileDownloader: StorageFileDownloaderTestClass;
  let tracker: DownloadProgressTrackerMock;

  beforeAll(() => {
    repository = new StorageFilesRepositoryMock();
    singleFileMatchingSearcher = new SingleFileMatchingSearcherTestClass();
    storageFileDownloader = new StorageFileDownloaderTestClass();
    tracker = new DownloadProgressTrackerMock();

    SUT = new StorageRemoteChangesSyncher(repository, singleFileMatchingSearcher, storageFileDownloader, tracker);
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deletes all files that are not present in virtual representation', async () => {
    const expectFilesDeleted = [StorageFileMother.random(), StorageFileMother.random(), StorageFileMother.random()];

    repository.returnAll(expectFilesDeleted);
    singleFileMatchingSearcher.returnAlways(undefined);

    await SUT.run();

    singleFileMatchingSearcher.assertHasBeenSearchedWith(
      expectFilesDeleted.map((f) => ({
        uuid: f.virtualId.value,
        status: FileStatuses.EXISTS,
      })),
    );
    repository.assertDeleteHasBeenCalledWith(expectFilesDeleted.map((f) => [f.id]));
    storageFileDownloader.assertHasNotBeenCalled();
  });

  it('deletes all files for witch the stored data does not match with the virtual', async () => {
    const expectFilesDeleted = [StorageFileMother.random(), StorageFileMother.random(), StorageFileMother.random()];

    repository.returnAll(expectFilesDeleted);
    singleFileMatchingSearcher.returnOneAtATime(expectFilesDeleted.map(() => FileMother.any()));
    storageFileDownloader.returnsAReadable();

    await SUT.run();

    singleFileMatchingSearcher.assertHasBeenSearchedWith(
      expectFilesDeleted.map((f) => ({
        uuid: f.virtualId.value,
        status: FileStatuses.EXISTS,
      })),
    );
    repository.assertDeleteHasBeenCalledWith(expectFilesDeleted.map((f) => [f.id]));
  });

  it('downloads all files for witch the stored data does not match with the virtual', async () => {
    const storageFilesFound = [StorageFileMother.random(), StorageFileMother.random()];

    const virtualFilesAssociated = storageFilesFound.map((sf) =>
      FileMother.fromPartial({
        uuid: sf.virtualId.value,
      }),
    );

    repository.returnAll(storageFilesFound);
    singleFileMatchingSearcher.returnOneAtATime(virtualFilesAssociated);
    storageFileDownloader.returnsAReadable();

    await SUT.run();

    repository.assertDeleteHasBeenCalledWith(storageFilesFound.map((f) => [f.id]));

    storageFileDownloader.assertHasBeenCalledWithStorageFile(
      virtualFilesAssociated.map((vf) =>
        StorageFile.from({
          id: vf.contentsId,
          virtualId: vf.uuid,
          size: vf.size,
        }),
      ),
    );
  });

  it('skips all files witch id match with the virtual file contents', async () => {
    const storageFilesFound = [StorageFileMother.random(), StorageFileMother.random()];

    const virtualFilesAssociated = storageFilesFound.map((sf) =>
      FileMother.fromPartial({
        uuid: sf.virtualId.value,
        contentsId: sf.id.value,
      }),
    );

    repository.returnAll(storageFilesFound);
    singleFileMatchingSearcher.returnOneAtATime(virtualFilesAssociated);

    await SUT.run();

    repository.assertDeleteHasBeenCalledWith([]);

    storageFileDownloader.assertHasBeenCalledWithStorageFile([]);
  });
});
