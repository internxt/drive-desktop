import { StorageFolderDeleter } from '../../../../../src/context/storage/StorageFolders/application/delete/StorageFolderDeleter';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FilesByPartialSearcherTestClass } from '../../../virtual-drive/files/__test-class__/search/FilesByPartialSearcherTestClass';
import { FileMother } from '../../../virtual-drive/files/domain/FileMother';
import { SingleFolderMatchingFinderTestClass } from '../../../virtual-drive/folders/__test-class__/SingleFolderMatchingFinderTestClass';
import { FoldersSearcherByPartialTestClass } from '../../../virtual-drive/folders/__test-class__/search/FoldersSearcherByPartialTestClass';
import { FolderMother } from '../../../virtual-drive/folders/domain/FolderMother';
import { StorageFileDeleterTestClass } from '../../StorageFiles/__test-class__/delete/StorageFileDeleterTestClass';

describe('Storage Folder Deleter', () => {
  let SUT: StorageFolderDeleter;

  let storageFileDeleter: StorageFileDeleterTestClass;
  let singleFolderMatchingFinder: SingleFolderMatchingFinderTestClass;
  let filesByPartialSearcher: FilesByPartialSearcherTestClass;
  let foldersSearcherByPartial: FoldersSearcherByPartialTestClass;

  let folderFound: Folder;

  beforeAll(() => {
    storageFileDeleter = new StorageFileDeleterTestClass();
    singleFolderMatchingFinder = new SingleFolderMatchingFinderTestClass();
    filesByPartialSearcher = new FilesByPartialSearcherTestClass();
    foldersSearcherByPartial = new FoldersSearcherByPartialTestClass();

    SUT = new StorageFolderDeleter(
      storageFileDeleter,
      singleFolderMatchingFinder,
      filesByPartialSearcher,
      foldersSearcherByPartial
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    folderFound = FolderMother.any();

    singleFolderMatchingFinder.finds(folderFound);
  });

  it('deletes all files on the given folder', async () => {
    const filesOnFolder = FileMother.array();
    filesByPartialSearcher.findsOnce(filesOnFolder);
    storageFileDeleter.succeeds();

    foldersSearcherByPartial.doesNotFindAny();

    await SUT.run(folderFound.path);

    storageFileDeleter.assertHasBeenCalledWith(
      filesOnFolder.map((f) => f.path)
    );
  });

  it('deletes all files on the subfolder', async () => {
    const filesOnFolder = FileMother.array();
    const filesOnSubfolder = FileMother.array();
    const subfolder = FolderMother.any();
    filesByPartialSearcher.findsOnce(filesOnFolder);
    storageFileDeleter.succeeds();
    filesByPartialSearcher.findsOnce(filesOnSubfolder);

    foldersSearcherByPartial.findsOnce([subfolder]);
    foldersSearcherByPartial.doesNotFindAny();

    await SUT.run(folderFound.path);

    storageFileDeleter.assertHasBeenCalledWith([
      ...filesOnFolder.map((f) => f.path),
      ...filesOnSubfolder.map((f) => f.path),
    ]);
  });

  it('searches for all the first level subfolders', async () => {
    filesByPartialSearcher.doesNotFindAny();

    const subfolders = FolderMother.array();
    foldersSearcherByPartial.findsOnce(subfolders);
    foldersSearcherByPartial.doesNotFindAny();

    await SUT.run(folderFound.path);

    filesByPartialSearcher.assertHasBeenCalledWith([
      { folderId: folderFound.id },
      ...subfolders.map((folder) => ({ folderId: folder.id })),
    ]);
  });
});
