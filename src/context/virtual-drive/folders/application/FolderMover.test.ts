import { ParentFolderFinder } from './ParentFolderFinder';
import { FolderMover } from './FolderMover';
import { FolderPath } from '../domain/FolderPath';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import path from 'path';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';

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
      FolderMother.fromPartial({ parentId: 2, path: destination.value }),
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

      const destinationPath = new FolderPath(path.join(parentDestination.path, original.name));

      remote.shouldMove();

      repository.matchingPartialMock.mockReturnValueOnce([]).mockReturnValueOnce([parentDestination]);

      await SUT.run(original, destinationPath);

      expect(repository.updateMock).toHaveBeenCalled();
    });

    it('calls the move method on the remote file system', async () => {
      const originalParent = FolderMother.createChildForm(root);
      const parentDestination = FolderMother.createChildForm(root);

      const original = FolderMother.createChildForm(originalParent);

      const destinationPath = new FolderPath(path.join(parentDestination.path, original.name));

      remote.shouldMove();

      repository.matchingPartialMock.mockReturnValueOnce([]).mockReturnValueOnce([parentDestination]);

      await SUT.run(original, destinationPath);
    });
  });
});
