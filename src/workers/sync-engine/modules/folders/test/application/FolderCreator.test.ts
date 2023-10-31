import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FolderCreator } from '../../application/FolderCreator';
import { FolderFinder } from '../../application/FolderFinder';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { Folder } from '../../domain/Folder';
import { FolderInternxtFileSystemMock } from '../__mocks__/FolderFileSystemMock';

describe('Folder Creator', () => {
  let SUT: FolderCreator;

  let repository: FolderRepositoryMock;
  let folderFinder: FolderFinder;
  let syncEngineIpc: IpcRendererSyncEngineMock;
  let fileSystem: FolderInternxtFileSystemMock;
  let eventBus: EventBusMock;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new FolderFinder(repository);
    syncEngineIpc = new IpcRendererSyncEngineMock();
    fileSystem = new FolderInternxtFileSystemMock();

    eventBus = new EventBusMock();

    SUT = new FolderCreator(fileSystem, repository, syncEngineIpc, eventBus);
  });

  it('creates on a folder from a offline folder', async () => {
    const offlineFolder = OfflineFolderMother.random();

    const parentFolder = FolderMother.fromPartial({
      id: offlineFolder.parentId,
      path: offlineFolder.dirname,
    });

    const resultFolderAttributes = FolderMother.fromPartial(
      offlineFolder.attributes()
    ).attributes();

    fileSystem.creteMock.mockResolvedValueOnce(
      Folder.create(resultFolderAttributes)
    );

    const spy = jest
      .spyOn(folderFinder, 'run')
      .mockResolvedValueOnce(parentFolder);

    await SUT.run(offlineFolder);

    expect(spy).toBeCalledWith(parentFolder.path.value);
    expect(fileSystem.creteMock).toBeCalledWith(offlineFolder);
  });

  describe('Synchronization messages', () => {
    it('sends the message FOLDER_CREATING', async () => {
      const offlineFolder = OfflineFolderMother.random();

      const parentFolder = FolderMother.fromPartial({
        id: offlineFolder.parentId,
        path: offlineFolder.dirname,
      });

      const resultFolderAttributes = FolderMother.fromPartial(
        offlineFolder.attributes()
      ).attributes();

      fileSystem.creteMock.mockResolvedValueOnce(
        Folder.create(resultFolderAttributes)
      );

      jest.spyOn(folderFinder, 'run').mockResolvedValueOnce(parentFolder);

      await SUT.run(offlineFolder);

      expect(syncEngineIpc.sendMock).toBeCalledWith('FOLDER_CREATING', {
        name: offlineFolder.name,
      });
    });

    it('sends the message FOLDER_CREATED', async () => {
      const offlineFolder = OfflineFolderMother.random();

      const parentFolder = FolderMother.fromPartial({
        id: offlineFolder.parentId,
        path: offlineFolder.dirname,
      });

      const resultFolderAttributes = FolderMother.fromPartial(
        offlineFolder.attributes()
      ).attributes();

      fileSystem.creteMock.mockResolvedValueOnce(
        Folder.create(resultFolderAttributes)
      );

      jest.spyOn(folderFinder, 'run').mockResolvedValueOnce(parentFolder);

      await SUT.run(offlineFolder);

      expect(syncEngineIpc.sendMock).toBeCalledWith('FOLDER_CREATED', {
        name: offlineFolder.name,
      });
    });
  });
});
