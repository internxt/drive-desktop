import { AllFilesInFolderAreAvailableOffline } from '../../../../../../src/context/storage/StorageFolders/application/offline/AllFilesInFolderAreAvailableOffline';
import { StorageFileId } from '../../../../../../src/context/storage/StorageFiles/domain/StorageFileId';
import { FilesByPartialSearcherTestClass } from '../../../../virtual-drive/files/__test-class__/search/FilesByPartialSearcherTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { SingleFolderMatchingFinderTestClass } from '../../../../virtual-drive/folders/__test-class__/SingleFolderMatchingFinderTestClass';
import { FoldersSearcherByPartialTestClass } from '../../../../virtual-drive/folders/__test-class__/search/FoldersSearcherByPartialTestClass';
import { FolderMother } from '../../../../virtual-drive/folders/domain/FolderMother';
import { StorageFilesRepositoryMock } from '../../__mocks__/StorageFilesRepositoryMock';

describe('All Files In Folder Are Available Offline', () => {
  let SUT: AllFilesInFolderAreAvailableOffline;

  let singleFolderFinder: SingleFolderMatchingFinderTestClass;
  let filesByPartialSearcher: FilesByPartialSearcherTestClass;
  let repository: StorageFilesRepositoryMock;
  let foldersSearcherByPartial: FoldersSearcherByPartialTestClass;

  beforeAll(() => {
    singleFolderFinder = new SingleFolderMatchingFinderTestClass();
    filesByPartialSearcher = new FilesByPartialSearcherTestClass();
    repository = new StorageFilesRepositoryMock();
    foldersSearcherByPartial = new FoldersSearcherByPartialTestClass();

    SUT = new AllFilesInFolderAreAvailableOffline(
      singleFolderFinder,
      filesByPartialSearcher,
      repository,
      foldersSearcherByPartial
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns true if the folder is empty', async () => {
    const folderFound = FolderMother.any();
    singleFolderFinder.finds([folderFound]);
    filesByPartialSearcher.findsOnce([]);
    foldersSearcherByPartial.doesNotFindAny();

    const result = await SUT.run(folderFound.path);

    expect(result).toBe(true);
  });

  it('returns false if the file is not avaliable offline', async () => {
    const fileFound = FileMother.any();
    const folderFound = FolderMother.any();
    singleFolderFinder.finds([folderFound]);
    filesByPartialSearcher.findsOnce([fileFound]);
    foldersSearcherByPartial.doesNotFindAny();
    const id = new StorageFileId(fileFound.contentsId);

    repository.shouldExists([{ id, value: false }]);

    const result = await SUT.run(folderFound.path);

    expect(result).toBe(false);
  });

  it('returns false if any file is not avaliable offline', async () => {
    const filesFound = [FileMother.any(), FileMother.any(), FileMother.any()];
    const ids = filesFound.map((file) => new StorageFileId(file.contentsId));

    const lastDoesNotExits = ids.map((id, i, arr) => {
      if (i == arr.length - 1) return { id, value: false };

      return { id, value: true };
    });

    const folderFound = FolderMother.any();
    singleFolderFinder.finds([folderFound]);

    filesByPartialSearcher.findsOnce(filesFound);
    foldersSearcherByPartial.doesNotFindAny();
    repository.shouldExists(lastDoesNotExits);

    const result = await SUT.run(folderFound.path);

    expect(result).toBe(false);
  });

  it('returns true if all files are avaliable offline', async () => {
    const filesFound = [FileMother.any(), FileMother.any(), FileMother.any()];
    const ids = filesFound.map((file) => new StorageFileId(file.contentsId));
    const allExists = ids.map((id) => ({ id, value: true }));
    const folderFound = FolderMother.any();

    singleFolderFinder.finds([folderFound]);

    filesByPartialSearcher.findsOnce(filesFound);
    repository.shouldExists(allExists);
    foldersSearcherByPartial.doesNotFindAny();

    const result = await SUT.run(folderFound.path);

    expect(result).toBe(true);
  });

  it('searches for subfolders files in a second level', async () => {
    const folderFound = FolderMother.any();

    singleFolderFinder.finds([folderFound]);

    // firsts level
    foldersSearcherByPartial.findsOnce([
      FolderMother.any(),
      FolderMother.any(),
    ]);
    // second level
    foldersSearcherByPartial.findsOnce([]);
    foldersSearcherByPartial.findsOnce([]);

    filesByPartialSearcher.finds([]);

    await SUT.run(folderFound.path);

    foldersSearcherByPartial.assertHasBeenCalledTimes(3);
  });

  it.each([0, 1, 20, 50, 100])(
    'searches for subfolders files in a %s level',
    async (level: number) => {
      const folderFound = FolderMother.any();

      singleFolderFinder.finds([folderFound]);

      for (let i = 0; i < level; i++) {
        foldersSearcherByPartial.findsOnce([FolderMother.any()]);
      }

      foldersSearcherByPartial.findsOnce([]);

      filesByPartialSearcher.finds([]);

      await SUT.run(folderFound.path);

      foldersSearcherByPartial.assertHasBeenCalledTimes(level + 1);
    }
  );

  // skipped due performance
  it.skip('searches for subfolders files in a deep level', async () => {
    const level = 100_000;
    const folderFound = FolderMother.any();

    singleFolderFinder.finds([folderFound]);

    for (let i = 0; i < level; i++) {
      foldersSearcherByPartial.findsOnce([FolderMother.any()]);
    }

    foldersSearcherByPartial.findsOnce([]);

    filesByPartialSearcher.finds([]);

    await SUT.run(folderFound.path);

    foldersSearcherByPartial.assertHasBeenCalledTimes(level + 1);
  });
});
