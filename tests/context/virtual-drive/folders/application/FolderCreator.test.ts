import { FolderCreator } from '../../../../../src/context/virtual-drive/folders/application/FolderCreator';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { IpcRendererSyncEngineMock } from '../../shared/__mock__/IpcRendererSyncEngineMock';
import { FolderPlaceholderConverterMock } from '../__mocks__/FolderPlaceholderConverterMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { FolderLocalFileSystemMock } from '../__mocks__/FolderLocalFileSystemMock';

describe('Folder Creator', () => {
  let SUT: FolderCreator;

  let repository: FolderRepositoryMock;
  let remote: FolderRemoteFileSystemMock;
  let syncEngineIpc: IpcRendererSyncEngineMock;
  let eventBus: EventBusMock;
  let folderPlaceholderConverter: FolderPlaceholderConverterMock;
  let folderLocalFileSystemMock: FolderLocalFileSystemMock;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    syncEngineIpc = new IpcRendererSyncEngineMock();
    remote = new FolderRemoteFileSystemMock();

    eventBus = new EventBusMock();
    folderPlaceholderConverter = new FolderPlaceholderConverterMock(
      folderLocalFileSystemMock
    );

    SUT = new FolderCreator(
      repository,
      remote,
      syncEngineIpc,
      eventBus,
      folderPlaceholderConverter
    );
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
