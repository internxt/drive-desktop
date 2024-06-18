import { FolderCreatorFromOfflineFolder } from '../../../../../src/context/virtual-drive/folders/application/create/FolderCreatorFromOfflineFolder';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { SyncFolderMessengerMock } from '../__mocks__/SyncFolderMessengerMock';
import { FolderMother } from '../domain/FolderMother';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';

const WITH_UUID = true;

describe('Folder Creator from Offline Folder', () => {
  let SUT: FolderCreatorFromOfflineFolder;

  let repository: FolderRepositoryMock;
  let remote: FolderRemoteFileSystemMock;
  let eventBus: EventBusMock;
  let messenger: SyncFolderMessengerMock;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    remote = new FolderRemoteFileSystemMock();
    messenger = new SyncFolderMessengerMock();

    eventBus = new EventBusMock();

    SUT = new FolderCreatorFromOfflineFolder(
      repository,
      remote,
      eventBus,
      messenger
    );
  });

  it('creates on a folder from a offline folder', async () => {
    const offlineFolder = OfflineFolderMother.random();
    const folder = FolderMother.fromPartial(offlineFolder.attributes());

    remote.shouldPersists(folder, WITH_UUID);

    repository.addMock.mockResolvedValueOnce(Promise.resolve());

    await SUT.run(offlineFolder);

    expect(repository.addMock).toBeCalledWith(folder);
  });

  describe('Synchronization messages', () => {
    it('sends the message FOLDER_CREATING', async () => {
      const offlineFolder = OfflineFolderMother.random();

      const expectedFolder = FolderMother.fromPartial(
        offlineFolder.attributes()
      );

      remote.shouldPersists(expectedFolder, WITH_UUID);
      // remote.persistMock.mockResolvedValueOnce(resultFolderAttributes);

      repository.addMock.mockImplementationOnce(() => {
        // no-op
      });

      await SUT.run(offlineFolder);

      expect(messenger.creatingMock).toBeCalledWith(offlineFolder.name);
    });

    it('sends the message FOLDER_CREATED', async () => {
      const offlineFolder = OfflineFolderMother.random();

      const expectedFolder = FolderMother.fromPartial(
        offlineFolder.attributes()
      );

      repository.addMock.mockImplementationOnce(() => {
        // no-op
      });

      remote.shouldPersists(expectedFolder, WITH_UUID);

      await SUT.run(offlineFolder);

      expect(messenger.createdMock).toBeCalledWith(offlineFolder.name);
    });
  });
});
