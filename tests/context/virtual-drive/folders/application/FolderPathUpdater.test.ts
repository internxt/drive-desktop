import { FolderMover } from '../../../../../src/context/virtual-drive/folders/application/FolderMover';
import { FolderRenamer } from '../../../../../src/context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderFinderTestClass } from '../__mocks__/FolderFinderTestClass';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { SyncFolderMessenger } from '../../../../../src/context/virtual-drive/folders/domain/SyncFolderMessenger';
import { SyncFolderMessengerMock } from '../__mocks__/SycnFolderMessengerMock';

describe('Folder Path Updater', () => {
  let repository: FolderRepositoryMock;
  let remoteFS: FolderRemoteFileSystemMock;
  let finder: FolderFinderTestClass;
  let syncFolderMessenger: SyncFolderMessengerMock;
  let mover: FolderMover;
  let renamer: FolderRenamer;

  let FolderPathUpdater;

  beforeEach(() => {
    repository = new FolderRepositoryMock();

    remoteFS = new FolderRemoteFileSystemMock();

    finder = new FolderFinderTestClass();

    mover = new FolderMover(repository, remoteFS, finder);

    const eventBus = new EventBusMock();

    syncFolderMessenger = new SyncFolderMessengerMock();

    renamer = new FolderRenamer(
      repository,
      remoteFS,
      eventBus,
      syncFolderMessenger
    );
  });

  it('throws a Folder Not Found Error if not folder is founded', () => {});
});
