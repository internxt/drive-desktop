import { mockDeep } from 'vitest-mock-extended';
import { AllParentFoldersStatusIsExists } from '../../../../../src/context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderDeleter } from '../../../../../src/context/virtual-drive/folders/application/FolderDeleter';
import { FolderMother } from '../domain/FolderMother';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

describe('Folder deleter', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);
  const remote = mockDeep<HttpRemoteFolderSystem>();
  const local = mockDeep<NodeWinLocalFolderSystem>();
  const deleteFolderByUuid = vi.mocked(driveServerWip.storage.deleteFolderByUuid);

  const SUT = new FolderDeleter(repository, remote, local, allParentFoldersStatusIsExists);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    deleteFolderByUuid.mockResolvedValue({ data: true });
    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid);

    expect(remote.trash).toBeCalledWith(folder);
  });

  it('throws an error when trashing a folder already trashed', async () => {
    const folder = FolderMother.trashed();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.delete).not.toBeCalled();
  });

  it('does not delete the folder if a higher folder is already deleted ', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.delete).not.toBeCalled();
  });

  it('recreates the placeholder if the deletion fails', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);
    remote.trash.mockRejectedValue(new Error('Error during the deletion'));

    await SUT.run(folder.uuid);

    expect(local.createPlaceHolder).toBeCalledWith(folder);
  });
});
