import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FolderCreator } from '../../application/FolderCreator';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { Folder } from '../../domain/Folder';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { off } from 'process';

describe('Folder Creator', () => {
  let SUT: FolderCreator;

  let repository: FolderRepositoryMock;
  let remote: FolderRemoteFileSystemMock;
  let syncEngineIpc: IpcRendererSyncEngineMock;
  let eventBus: EventBusMock;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    syncEngineIpc = new IpcRendererSyncEngineMock();
    remote = new FolderRemoteFileSystemMock();

    eventBus = new EventBusMock();

    SUT = new FolderCreator(repository, remote, syncEngineIpc, eventBus);
  });

  it('creates on a folder from a offline folder', async () => {
    const offlineFolder = OfflineFolderMother.random();
    const folder = FolderMother.fromPartial(offlineFolder.attributes());

    remote.persistMock.mockResolvedValueOnce(folder.attributes());

    repository.addMock.mockResolvedValueOnce(Promise.resolve());

    await SUT.run(offlineFolder);

    expect(repository.addMock).toBeCalledWith(folder);
  });

  describe('Synchronization messages', () => {
    it('sends the message FOLDER_CREATING', async () => {
      const offlineFolder = OfflineFolderMother.random();

      const resultFolderAttributes = FolderMother.fromPartial(
        offlineFolder.attributes()
      ).attributes();

      remote.persistMock.mockResolvedValueOnce(resultFolderAttributes);

      repository.addMock.mockResolvedValueOnce(
        Folder.create(resultFolderAttributes)
      );

      await SUT.run(offlineFolder);

      expect(syncEngineIpc.sendMock).toBeCalledWith('FOLDER_CREATING', {
        name: offlineFolder.name,
      });
    });

    it('sends the message FOLDER_CREATED', async () => {
      const offlineFolder = OfflineFolderMother.random();

      const resultFolderAttributes = FolderMother.fromPartial(
        offlineFolder.attributes()
      ).attributes();

      repository.addMock.mockResolvedValueOnce(
        Folder.create(resultFolderAttributes)
      );

      remote.persistMock.mockResolvedValueOnce(resultFolderAttributes);

      await SUT.run(offlineFolder);

      expect(syncEngineIpc.sendMock).toBeCalledWith('FOLDER_CREATED', {
        name: offlineFolder.name,
      });
    });
  });
});
