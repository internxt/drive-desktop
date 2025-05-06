import { FilesByPartialSearcher } from '../../../../virtual-drive/files/application/search/FilesByPartialSearcher';
import { SingleFolderMatchingFinder } from '../../../../virtual-drive/folders/application/SingleFolderMatchingFinder';
import { AllFilesInFolderAreAvailableOffline } from './AllFilesInFolderAreAvailableOffline';
import { StorageFilesRepository } from '../../../StorageFiles/domain/StorageFilesRepository';
import { Folder } from '../../../../virtual-drive/folders/domain/Folder';
import { FoldersSearcherByPartial } from '../../../../virtual-drive/folders/application/search/FoldersSearcherByPartial';

describe('AllFilesInFolderAreAvailableOffline', () => {
  let singleFolderFinderMock: jest.Mocked<SingleFolderMatchingFinder>;
  let filesByPartialSearcherMock: jest.Mocked<FilesByPartialSearcher>;
  let repositoryMock: jest.Mocked<StorageFilesRepository>;
  let foldersSearcherByPartialMock: jest.Mocked<FoldersSearcherByPartial>;
  let sut: AllFilesInFolderAreAvailableOffline;

  const mockFolder = (id: number): Folder =>
    ({
      id,
    } as unknown as Folder);

  const mockFile = (contentsId: string): File => {
    return Object.create({
      _contentsId: contentsId,
      contentsId,
    }) as File;
  };

  beforeEach(() => {
    singleFolderFinderMock = {
      run: jest.fn(),
    } as unknown as jest.Mocked<SingleFolderMatchingFinder>;

    foldersSearcherByPartialMock = {
      run: jest.fn(),
    } as unknown as jest.Mocked<FoldersSearcherByPartial>;

    filesByPartialSearcherMock = {
      run: jest.fn(),
    } as unknown as jest.Mocked<FilesByPartialSearcher>;

    repositoryMock = {
      exists: jest.fn(),
    } as unknown as jest.Mocked<StorageFilesRepository>;

    sut = new AllFilesInFolderAreAvailableOffline(
      singleFolderFinderMock,
      filesByPartialSearcherMock,
      repositoryMock,
      foldersSearcherByPartialMock
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when all files and subfolders are available offline', async () => {
    const folder = mockFolder(1);
    const file = mockFile('d75fdf14-c3c9-4ab2-970ds');

    singleFolderFinderMock.run.mockResolvedValue(folder);
    foldersSearcherByPartialMock.run.mockResolvedValue([]);
    // @ts-ignore
    filesByPartialSearcherMock.run.mockResolvedValue([file]);

    repositoryMock.exists.mockResolvedValue(true);

    const result = await sut.run(folder.path);

    expect(result).toBe(true);
  });

  it('should return false when not all files are available offline', () => {
    const folder = mockFolder(1);
    const file = mockFile('d75fdf14-c3c9-4ab2-970ds');

    singleFolderFinderMock.run.mockResolvedValue(folder);
    foldersSearcherByPartialMock.run.mockResolvedValue([]);
    // @ts-ignore
    filesByPartialSearcherMock.run.mockResolvedValue([file]);

    repositoryMock.exists.mockResolvedValue(false);

    expect(sut.run(folder.path)).resolves.toBe(false);
  });
});
