import { FolderRenamer } from '../../../../../src/context/virtual-drive/folders/application/FolderRenamer';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';
import { FolderPathMother } from '../domain/FolderPathMother';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { SyncFolderMessengerMock } from '../__mocks__/SyncFolderMessengerMock';

describe('Folder Renamer', () => {
  let repository: FolderRepositoryMock;
  let remote: FolderRemoteFileSystemMock;
  let syncFolderMessenger: SyncFolderMessengerMock;
  let renamer: FolderRenamer;

  beforeEach(() => {
    repository = new FolderRepositoryMock();

    remote = new FolderRemoteFileSystemMock();

    const eventBus = new EventBusMock();

    syncFolderMessenger = new SyncFolderMessengerMock();

    renamer = new FolderRenamer(
      repository,
      remote,
      eventBus,
      syncFolderMessenger
    );
  });

  const setUpHappyPath = (): {
    folder: Folder;
    destination: FolderPath;
    expectedFolder: Folder;
  } => {
    const folder = FolderMother.any();
    const destination = FolderPathMother.onFolder(folder.dirname);

    const expectedFolder = FolderMother.fromPartial({
      path: destination.value,
    });

    remote.shouldRename(expectedFolder);

    return {
      folder,
      destination,
      expectedFolder,
    };
  };

  describe('Remote syncing', () => {
    it('renames the folder with the new name', async () => {
      const { folder, destination } = setUpHappyPath();

      await renamer.run(folder, destination);
    });
  });

  describe('Local syncing', () => {
    it('updates the local repository', async () => {
      const { folder, destination } = setUpHappyPath();

      await renamer.run(folder, destination);

      expect(repository.updateMock).toBeCalledTimes(1);
      expect(repository.updateMock).toBeCalledWith(
        expect.objectContaining({ _path: destination })
      );
    });
  });

  describe('Messaging', () => {
    it('sends a message when starts to rename', async () => {
      const { folder, destination } = setUpHappyPath();
      const original = folder.name;

      await renamer.run(folder, destination);

      expect(syncFolderMessenger.renameMock).toBeCalledTimes(1);
      expect(syncFolderMessenger.renameMock).toBeCalledWith(
        original,
        destination.name()
      );
    });

    it('sends a message when the rename has been completed', async () => {
      const { folder, destination } = setUpHappyPath();
      const original = folder.name;

      await renamer.run(folder, destination);

      expect(syncFolderMessenger.renamedMock).toBeCalledTimes(1);
      expect(syncFolderMessenger.renamedMock).toBeCalledWith(
        original,
        destination.name()
      );
    });
  });
});
