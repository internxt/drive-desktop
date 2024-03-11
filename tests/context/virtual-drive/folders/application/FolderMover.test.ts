import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { FolderMover } from '../../../../../src/context/virtual-drive/folders/application/FolderMover';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';
import path from 'path';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: ParentFolderFinder;
  let remote: FolderRemoteFileSystemMock;
  let SUT: FolderMover;

  const root = FolderMother.root();

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new ParentFolderFinder(repository);
    remote = new FolderRemoteFileSystemMock();

    SUT = new FolderMover(repository, remote, folderFinder);
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
      const originalParent = FolderMother.createChildForm(root);
      const parentDestination = FolderMother.createChildForm(root);

      const original = FolderMother.createChildForm(originalParent);

      const destinationPath = new FolderPath(
        path.join(parentDestination.path, original.name)
      );

      const expectedFolder = FolderMother.fromPartial({
        path: destinationPath.value,
        id: original.id,
        parentId: parentDestination.id,
      });

      remote.shouldMove(expectedFolder);

      repository.matchingPartialMock
        .mockReturnValueOnce([])
        .mockReturnValueOnce([parentDestination]);

      await SUT.run(original, destinationPath);

      expect(repository.updateMock).toHaveBeenCalled();
    });

    it('calls the move method on the remote file system', async () => {
      const originalParent = FolderMother.createChildForm(root);
      const parentDestination = FolderMother.createChildForm(root);

      const original = FolderMother.createChildForm(originalParent);

      const destinationPath = new FolderPath(
        path.join(parentDestination.path, original.name)
      );

      const expectedFolder = FolderMother.fromPartial({
        path: destinationPath.value,
        id: original.id,
        parentId: parentDestination.id,
      });

      remote.shouldMove(expectedFolder);

      repository.matchingPartialMock
        .mockReturnValueOnce([])
        .mockReturnValueOnce([parentDestination]);

      await SUT.run(original, destinationPath);
    });
  });
});
