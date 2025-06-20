import { mockDeep } from 'vitest-mock-extended';
import { AllParentFoldersStatusIsExists } from '../../../../../src/context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderDeleter } from '../../../../../src/context/virtual-drive/folders/application/FolderDeleter';
import { FolderMother } from '../domain/FolderMother';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

describe('Folder deleter', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);
  const local = mockDeep<NodeWinLocalFolderSystem>();
  const deleteFolderByUuid = vi.mocked(driveServerWip.storage.deleteFolderByUuid);

  const SUT = new FolderDeleter(repository, local, allParentFoldersStatusIsExists);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    deleteFolderByUuid.mockResolvedValue({ data: true });
    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid);
    expect(driveServerWip.storage.deleteFolderByUuid).toBeCalledWith({ uuid: folder.uuid });
    expect(repository.update).toBeCalledWith(folder);
  });

  it('throws an error when trashing a folder already trashed', async () => {
    const folder = FolderMother.trashed();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });
    expect(driveServerWip.storage.deleteFolderByUuid).not.toBeCalled();
    expect(repository.update).not.toBeCalled();
  });

  it('does not delete the folder if a higher folder is already deleted ', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartial.mockReturnValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });
    expect(driveServerWip.storage.deleteFolderByUuid).not.toBeCalled();
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
