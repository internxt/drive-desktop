import { FolderFinder } from '../../application/FolderFinder';
import { FolderMover } from '../../application/FolderMover';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderPath } from '../../domain/FolderPath';
import { FolderInternxtFileSystemMock } from '../__mocks__/FolderFileSystemMock';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: FolderFinder;
  let fileSystem: FolderInternxtFileSystemMock;
  let SUT: FolderMover;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new FolderFinder(repository);
    fileSystem = new FolderInternxtFileSystemMock();

    SUT = new FolderMover(fileSystem, repository, folderFinder);
  });

  it('Folders cannot be overwrite', async () => {
    const folder = FolderMother.in(1, '/folderA/folderB');
    const destination = new FolderPath('/folderC/folderB');

    repository.searchByPartialMock.mockImplementation(() =>
      FolderMother.in(2, destination.value)
    );

    try {
      const hasBeenOverwritten = await SUT.run(folder, destination);
      expect(hasBeenOverwritten).not.toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(repository.updateMock).not.toBeCalledTimes(1);
  });

  describe('Move', () => {
    it('moves a folder when the destination folder does not contain a folder with the same folder', async () => {
      const folder = FolderMother.in(1, '/folderA/folderB');
      const destination = new FolderPath('/folderC/folderB');
      const folderC = FolderMother.in(2, '/folderC');

      repository.searchByPartialMock
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(folderC);

      await SUT.run(folder, destination);

      expect(repository.updateMock).toHaveBeenCalledTimes(1);
    });
  });
});
