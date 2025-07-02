import { mockDeep } from 'vitest-mock-extended';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { AllParentFoldersStatusIsExists } from './AllParentFoldersStatusIsExists';
import { FolderDeleter } from './FolderDeleter';
import { FolderMother } from '@/tests/context/virtual-drive/folders/domain/FolderMother';

vi.mock(import('@/infra/drive-server-wip/out/ipc-renderer'));

describe('Folder deleter', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);
  const local = mockDeep<NodeWinLocalFolderSystem>();
  const ipcRendererDriveServerWipMock = vi.mocked(ipcRendererDriveServerWip);

  const SUT = new FolderDeleter(repository, local, allParentFoldersStatusIsExists);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    ipcRendererDriveServerWipMock.invoke.mockResolvedValue({ data: true });
    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid);
    expect(repository.update).toBeCalledWith(folder);
    expect(ipcRendererDriveServerWipMock.invoke).toBeCalledWith('storageDeleteFolderByUuid', {
      uuid: folder.uuid,
      workspaceToken: '',
    });
  });

  it('throws an error when trashing a folder already trashed', async () => {
    const folder = FolderMother.trashed();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });
    expect(ipcRendererDriveServerWipMock.invoke).not.toBeCalled();
    expect(repository.update).not.toBeCalled();
  });

  it('does not delete the folder if a higher folder is already deleted ', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });
    expect(ipcRendererDriveServerWipMock.invoke).not.toBeCalled();
    expect(repository.update).not.toBeCalled();
  });

  it('recreates the placeholder if the deletion fails', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid);

    expect(local.createPlaceHolder).toBeCalledWith(folder);
  });
});
