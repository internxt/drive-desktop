import { FolderRenamer } from './FolderRenamer';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderPathMother } from '../domain/__test-helpers__/FolderPathMother';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { SyncFolderMessengerMock } from '../__mocks__/SyncFolderMessengerMock';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';
import { EventBusMock } from '../../shared/__mocks__/EventBusMock';
import { FolderDescendantsPathUpdater } from './FolderDescendantsPathUpdater';
import * as renameFolderModule from '../../../../infra/drive-server/services/folder/services/rename-folder';
import { call, partialSpyOn } from 'tests/vitest/utils.helper';

describe('Folder Renamer', () => {
  let repository: FolderRepositoryMock;
  let syncFolderMessenger: SyncFolderMessengerMock;
  let descendantsPathUpdater: FolderDescendantsPathUpdater;
  let renamer: FolderRenamer;

  const renameFolderMock = partialSpyOn(renameFolderModule, 'renameFolder');

  beforeEach(() => {
    repository = new FolderRepositoryMock();

    const eventBus = new EventBusMock();

    syncFolderMessenger = new SyncFolderMessengerMock();

    descendantsPathUpdater = {
      syncDescendants: vi.fn().mockResolvedValue(undefined),
    } as unknown as FolderDescendantsPathUpdater;

    renamer = new FolderRenamer(repository, eventBus, syncFolderMessenger, descendantsPathUpdater);
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

    renameFolderMock.mockResolvedValue({ data: {} as any });

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

      call(renameFolderMock).toMatchObject({
        uuid: folder.uuid,
        plainName: destination.name(),
      });
    });
  });

  describe('Local syncing', () => {
    it('updates the local repository', async () => {
      const { folder, destination } = setUpHappyPath();

      await renamer.run(folder, destination);

      expect(repository.updateMock).toBeCalledTimes(1);
      expect(repository.updateMock).toBeCalledWith(expect.objectContaining({ _path: destination }));
    });
  });

  describe('Messaging', () => {
    it('sends a message when starts to rename', async () => {
      const { folder, destination } = setUpHappyPath();
      const original = folder.name;

      await renamer.run(folder, destination);

      expect(syncFolderMessenger.renameMock).toBeCalledTimes(1);
      expect(syncFolderMessenger.renameMock).toBeCalledWith(original, destination.name());
    });

    it('sends a message when the rename has been completed', async () => {
      const { folder, destination } = setUpHappyPath();
      const original = folder.name;

      await renamer.run(folder, destination);

      expect(syncFolderMessenger.renamedMock).toBeCalledTimes(1);
      expect(syncFolderMessenger.renamedMock).toBeCalledWith(original, destination.name());
    });
  });

  describe('Descendants path update', () => {
    it('updates paths of all descendant folders and files asynchronously', async () => {
      const { folder, destination } = setUpHappyPath();
      const oldPath = folder.path;

      const runMock = vi.fn().mockResolvedValue(undefined);
      descendantsPathUpdater.syncDescendants = runMock;

      await renamer.run(folder, destination);

      expect(runMock).toBeCalledTimes(1);
      expect(runMock).toBeCalledWith(expect.objectContaining({ _path: destination }), oldPath);
    });

    it('does not block rename even if descendants update fails', async () => {
      const { folder, destination } = setUpHappyPath();

      const runMock = vi.fn().mockRejectedValue(new Error('Update failed'));
      descendantsPathUpdater.syncDescendants = runMock;

      await expect(renamer.run(folder, destination)).resolves.not.toThrow();

      expect(repository.updateMock).toBeCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('throws when renameFolder returns an error', async () => {
      const folder = FolderMother.any();
      const destination = FolderPathMother.onFolder(folder.dirname);

      const error = new Error('rename failed');
      renameFolderMock.mockResolvedValue({ error } as any);

      await expect(renamer.run(folder, destination)).rejects.toBe(error);

      expect(repository.updateMock).not.toBeCalled();
    });
  });
});
