import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderMother } from '../domain/FolderMother';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FolderPlaceholderConverter } from '@/context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { mockDeep } from 'vitest-mock-extended';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FolderId } from '@/context/virtual-drive/folders/domain/FolderId';
import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderUuid';
import { FolderPath } from '@/context/virtual-drive/folders/domain/FolderPath';
import { EventRecorder } from '@/context/virtual-drive/shared/infrastructure/EventRecorder';

describe('Folder Creator', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const remote = mockDeep<HttpRemoteFolderSystem>();
  const syncEngineIpc = mockDeep<SyncEngineIpc>();
  const eventBus = mockDeep<EventRecorder>();
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
    expect(repository.add).toBeCalledWith(
      expect.objectContaining({
        _id: new FolderId(folder.id),
        _parentId: new FolderId(folder.parentId ?? 0),
        _parentUuid: new FolderUuid(folder.parentUuid ?? ''),
        _path: new FolderPath(folder.path),
        _uuid: new FolderUuid(folder.uuid ?? ''),
      }),
    );
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
