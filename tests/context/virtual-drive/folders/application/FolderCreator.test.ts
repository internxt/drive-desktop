import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderMother } from '../domain/FolderMother.helper.test';
import { OfflineFolderMother } from '../domain/OfflineFolderMother.helper.test';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { EventBus } from '@/context/virtual-drive/shared/domain/EventBus';
import { FolderPlaceholderConverter } from '@/context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { mockDeep } from 'vitest-mock-extended';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';

describe('Folder Creator', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const remote = mockDeep<HttpRemoteFolderSystem>();
  const syncEngineIpc = mockDeep<SyncEngineIpc>();
  const eventBus = mockDeep<EventBus>();
  const folderPlaceholderConverter = mockDeep<FolderPlaceholderConverter>();

  const SUT = new FolderCreator(repository, remote, syncEngineIpc, eventBus, folderPlaceholderConverter);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates on a folder from a offline folder', async () => {
    // Arrange
    const offlineFolder = OfflineFolderMother.random();
    const folder = FolderMother.fromPartial(offlineFolder.attributes());
    remote.persist.mockResolvedValueOnce(folder.attributes());

    // Act
    await SUT.run(offlineFolder);

    // Assert
    expect(repository.add).toBeCalledWith(folder);
  });

  describe('Synchronization messages', () => {
    it('sends the message FOLDER_CREATING', async () => {
      // Arrange
      const offlineFolder = OfflineFolderMother.random();
      const folder = FolderMother.fromPartial(offlineFolder.attributes());
      remote.persist.mockResolvedValueOnce(folder.attributes());

      // Act
      await SUT.run(offlineFolder);

      // Assert
      expect(syncEngineIpc.send).toBeCalledWith('FOLDER_CREATING', { name: offlineFolder.name });
    });

    it('sends the message FOLDER_CREATED', async () => {
      // Arrange
      const offlineFolder = OfflineFolderMother.random();
      const folder = FolderMother.fromPartial(offlineFolder.attributes());
      remote.persist.mockResolvedValueOnce(folder.attributes());

      // Act
      await SUT.run(offlineFolder);

      // Arrange
      expect(syncEngineIpc.send).toBeCalledWith('FOLDER_CREATED', { name: offlineFolder.name });
    });
  });
});
