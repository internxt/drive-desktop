import { FolderRepository } from '../../domain/FolderRepository';
import { FolderRepositorySynchronizer } from './FolderRepositorySynchronizer';
import { Folder } from '../../domain/Folder';

describe('FolderRepositorySynchronizer', () => {
  let folderRepositoryMock: jest.Mocked<FolderRepository>;
  let sut: FolderRepositorySynchronizer;

  beforeEach(() => {
    folderRepositoryMock = {
      all: jest.fn(),
      add: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<FolderRepository>;
    sut = new FolderRepositorySynchronizer(folderRepositoryMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockFolder = (id: string, path: string, isRoot = false): Folder =>
    ({
      id,
      path,
      isRoot: () => isRoot,
    } as unknown as Folder);

  it('should add the remote folders', async () => {
    const remoteFolders = [
      mockFolder('1', '/documents'),
      mockFolder('2', '/projects'),
    ];

    folderRepositoryMock.all.mockResolvedValue([]);

    await sut.run(remoteFolders);

    expect(folderRepositoryMock.add).toHaveBeenCalledTimes(2);
    expect(folderRepositoryMock.add).toHaveBeenCalledWith(remoteFolders[0]);
    expect(folderRepositoryMock.add).toHaveBeenCalledWith(remoteFolders[1]);
    expect(folderRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it('should delete the folders that are not in the remote folders, except root', async () => {
    const remoteFolders = [
      mockFolder('root', '/', true),
      mockFolder('1', '/documents'),
      mockFolder('2', '/projects'),
    ];

    const localFolders = [
      mockFolder('root', '/', true),
      mockFolder('1', '/documents'),
      mockFolder('3', '/old-folder'),
    ];

    folderRepositoryMock.all.mockResolvedValue(localFolders);

    await sut.run(remoteFolders);

    expect(folderRepositoryMock.add).toHaveBeenCalledTimes(3);
    expect(folderRepositoryMock.delete).toHaveBeenCalledTimes(1);
    expect(folderRepositoryMock.delete).toHaveBeenCalledWith('3');
    expect(folderRepositoryMock.delete).not.toHaveBeenCalledWith('root');
  });

  it('should delete multiple folders not present in remote, but never delete root', async () => {
    const remoteFolders = [
      mockFolder('root', '/', true),
      mockFolder('1', '/documents'),
    ];

    const localFolders = [
      mockFolder('root', '/', true),
      mockFolder('1', '/documents'),
      mockFolder('2', '/should-be-deleted-1'),
      mockFolder('3', '/should-be-deleted-2'),
    ];

    folderRepositoryMock.all.mockResolvedValue(localFolders);

    await sut.run(remoteFolders);

    expect(folderRepositoryMock.delete).toHaveBeenCalledTimes(2);
    expect(folderRepositoryMock.delete).toHaveBeenCalledWith('2');
    expect(folderRepositoryMock.delete).toHaveBeenCalledWith('3');
    expect(folderRepositoryMock.delete).not.toHaveBeenCalledWith('root');
  });
});
