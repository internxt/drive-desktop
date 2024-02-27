import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { FolderMover } from '../../../../../src/context/virtual-drive/folders/application/FolderMover';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: ParentFolderFinder;
  let remoteFileSystem: FolderRemoteFileSystemMock;
  let SUT: FolderMover;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new ParentFolderFinder(repository);
    remoteFileSystem = new FolderRemoteFileSystemMock();

    SUT = new FolderMover(repository, remoteFileSystem, folderFinder);
  });

  it('Folders cannot be overwrite', async () => {
    const folder = FolderMother.fromPartial({
      parentId: 1,
      path: '/folderA/folderB',
    });
    const destination = new FolderPath('/folderC/folderB');

    repository.matchingPartialMock.mockImplementation(() =>
      FolderMother.fromPartial({ parentId: 2, path: destination.value })
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
      const folder = FolderMother.fromPartial({
        parentId: 1,
        path: '/folderA/folderB',
      });
      const destination = new FolderPath('/folderC/folderB');
      const folderC = FolderMother.fromPartial({
        parentId: 2,
        path: '/folderC',
      });

      repository.matchingPartialMock
        .mockReturnValueOnce([])
        .mockReturnValueOnce([folderC]);

      await SUT.run(folder, destination);

      expect(repository.updateMock).toHaveBeenCalled();
    });
  });
});
