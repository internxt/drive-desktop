import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../../src/context/virtual-drive/folders/application/FolderMover';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: FolderFinder;
  let remoteFileSystem: FolderRemoteFileSystemMock;
  let SUT: FolderMover;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new FolderFinder(repository);
    remoteFileSystem = new FolderRemoteFileSystemMock();

    SUT = new FolderMover(repository, remoteFileSystem, folderFinder);
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

    expect(repository.updateMock).not.toBeCalled();
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

      expect(repository.updateMock).toHaveBeenCalled();
    });
  });
});
