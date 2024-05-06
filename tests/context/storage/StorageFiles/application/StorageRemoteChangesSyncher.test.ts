import { StorageRemoteChangesSyncher } from '../../../../../src/context/storage/StorageFiles/application/sync/StorageRemoteChangesSyncher';
import { StorageFile } from '../../../../../src/context/storage/StorageFiles/domain/StorageFile';
import { FileStatuses } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';
import { SingleFileMatchingSearcherTestClass } from '../../../virtual-drive/files/__test-class__/SingleFileMatchingSearcherTestClass';
import { FileMother } from '../../../virtual-drive/files/domain/FileMother';
import { StorageFileDownloaderTestClass } from '../__test-class__/download/StorageFileDownloaderTestClass';
import { StorageFilesRepositoryMock } from '../__mocks__/StorageFilesRepositoryMock';
import { StorageFileMother } from '../domain/StorageFileMother';

describe('Storage Remote Changes Syncher', () => {
  let SUT: StorageRemoteChangesSyncher;

  let repository: StorageFilesRepositoryMock;
  let singleFileMatchingSearcher: SingleFileMatchingSearcherTestClass;
  let storageFileDownloader: StorageFileDownloaderTestClass;

  beforeAll(() => {
    repository = new StorageFilesRepositoryMock();
    singleFileMatchingSearcher = new SingleFileMatchingSearcherTestClass();
    storageFileDownloader = new StorageFileDownloaderTestClass();

    SUT = new StorageRemoteChangesSyncher(
      repository,
      singleFileMatchingSearcher,
      storageFileDownloader
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('deletes all files that are not present in virtual representation', async () => {
    const expectFilesDeleted = [
      StorageFileMother.random(),
      StorageFileMother.random(),
      StorageFileMother.random(),
    ];

    repository.returnAll(expectFilesDeleted);
    singleFileMatchingSearcher.returnAlways(undefined);

    await SUT.run();

    singleFileMatchingSearcher.assertHasBeenSearchedWith(
      expectFilesDeleted.map((f) => ({
        uuid: f.virtualId.value,
        status: FileStatuses.EXISTS,
      }))
    );
    repository.assertDeleteHasBeenCalledWith(
      expectFilesDeleted.map((f) => [f.id])
    );
    storageFileDownloader.assertHasNotBeenCalled();
  });

  it('deletes all files for witch the stored data does not match with the virtual', async () => {
    const expectFilesDeleted = [
      StorageFileMother.random(),
      StorageFileMother.random(),
      StorageFileMother.random(),
    ];

    repository.returnAll(expectFilesDeleted);
    singleFileMatchingSearcher.returnOneAtATime(
      expectFilesDeleted.map(() => FileMother.any())
    );

    await SUT.run();

    singleFileMatchingSearcher.assertHasBeenSearchedWith(
      expectFilesDeleted.map((f) => ({
        uuid: f.virtualId.value,
        status: FileStatuses.EXISTS,
      }))
    );
    repository.assertDeleteHasBeenCalledWith(
      expectFilesDeleted.map((f) => [f.id])
    );
  });

  it('downloads all files for witch the stored data does not match with the virtual', async () => {
    const storageFilesFound = [
      StorageFileMother.random(),
      StorageFileMother.random(),
    ];

    const virtualFilesAssociated = storageFilesFound.map((sf) =>
      FileMother.fromPartial({
        uuid: sf.virtualId.value,
      })
    );

    repository.returnAll(storageFilesFound);
    singleFileMatchingSearcher.returnOneAtATime(virtualFilesAssociated);

    await SUT.run();

    repository.assertDeleteHasBeenCalledWith(
      storageFilesFound.map((f) => [f.id])
    );

    storageFileDownloader.assertHasBeenCalledWithStorageFile(
      virtualFilesAssociated.map((vf) =>
        StorageFile.from({
          id: vf.contentsId,
          virtualId: vf.uuid,
          size: vf.size,
        })
      )
    );
  });

  it('skips all files witch id match with the virtual file contents', async () => {
    const storageFilesFound = [
      StorageFileMother.random(),
      StorageFileMother.random(),
    ];

    const virtualFilesAssociated = storageFilesFound.map((sf) =>
      FileMother.fromPartial({
        uuid: sf.virtualId.value,
        contentsId: sf.id.value,
      })
    );

    repository.returnAll(storageFilesFound);
    singleFileMatchingSearcher.returnOneAtATime(virtualFilesAssociated);

    await SUT.run();

    repository.assertDeleteHasBeenCalledWith([]);

    storageFileDownloader.assertHasBeenCalledWithStorageFile([]);
  });
});
