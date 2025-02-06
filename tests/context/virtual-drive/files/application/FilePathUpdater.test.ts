import { mockDeep } from 'vitest-mock-extended';
import { FileFinderByContentsId } from '../../../../../src/context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../../../../src/context/virtual-drive/files/application/FilePathUpdater';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FolderMother } from '../../folders/domain/FolderMother';
import { FileMother } from '../domain/FileMother';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { EventBus } from '@/context/virtual-drive/shared/domain/EventBus';
import { RemoteFileSystem } from '@/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { NodeWinLocalFileSystem } from '@/context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';

describe('File path updater', () => {
  const repository = mockDeep<InMemoryFileRepository>();
  const fileFinderByContentsId = new FileFinderByContentsId(repository);
  const folderFinder = mockDeep<FolderFinder>();
  const ipcRenderer = mockDeep<SyncEngineIpc>();
  const localFileSystem = mockDeep<NodeWinLocalFileSystem>();
  const eventBus = mockDeep<EventBus>();
  const remoteFileSystem = mockDeep<RemoteFileSystem>();

  const SUT = new FilePathUpdater(
    remoteFileSystem,
    localFileSystem,
    repository,
    fileFinderByContentsId,
    folderFinder,
    ipcRenderer,
    eventBus
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renames a file when the extension and folder does not change', async () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    repository.searchByPartial.mockReturnValueOnce(fileToRename).mockReturnValueOnce(fileWithDestinationPath);

    const destination = new FilePath(`${fileToRename.dirname}/_${fileToRename.nameWithExtension}`);

    await SUT.run(fileToRename.contentsId, destination.value);

    expect(repository.update).toBeCalledWith(expect.objectContaining({ path: destination.value }));
    expect(remoteFileSystem.rename).toBeCalledWith(expect.objectContaining({ path: destination.value }));
  });

  it('does not rename or moves a file when the extension changes', async () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    repository.searchByPartial.mockReturnValueOnce(fileToRename).mockReturnValueOnce(fileWithDestinationPath);

    const destination = new FilePath(`${fileToRename.dirname}/_${fileToRename.nameWithExtension}n`);

    expect(async () => {
      await SUT.run(fileToRename.contentsId, destination.value);
    }).rejects.toThrow();
  });

  it('moves a file when the folder changes', async () => {
    const fileToMove = FileMother.any();
    const fileInDestination = undefined;
    const localFileId = '1-2';

    repository.searchByPartial.mockReturnValueOnce(fileToMove).mockReturnValueOnce(fileInDestination);

    localFileSystem.getLocalFileId.mockResolvedValueOnce(localFileId);

    const destination = new FilePath(`${fileToMove.dirname}_/${fileToMove.nameWithExtension}`);

    const destinationFolder = FolderMother.fromPartial({
      id: fileToMove.folderId + 1,
      path: destination.dirname(),
    });

    folderFinder.run.mockReturnValueOnce(destinationFolder);

    await SUT.run(fileToMove.contentsId, destination.value);

    expect(repository.update).toBeCalledWith(
      expect.objectContaining({
        folderId: destinationFolder.id,
        path: destination.value,
      })
    );
    expect(remoteFileSystem.move).toBeCalledWith(
      expect.objectContaining({
        folderId: destinationFolder.id,
        path: destination.value,
      })
    );
  });
});
