import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { AllParentFoldersStatusIsExists } from '../../../../../src/context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FileStatus } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';
import { mockDeep } from 'vitest-mock-extended';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { NodeWinLocalFileSystem } from '@/context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { ContentsIdMother } from '@/tests/context/virtual-drive/contents/domain/ContentsIdMother';
import { FileMother } from '@/tests/context/virtual-drive/files/domain/FileMother';

vi.mock(import('@/infra/drive-server-wip/out/ipc-renderer'));

describe('File Deleter', () => {
  const repository = mockDeep<InMemoryFileRepository>();
  const folderRepository = mockDeep<InMemoryFolderRepository>();
  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(folderRepository);
  const localFileSystem = mockDeep<NodeWinLocalFileSystem>();
  const ipc = mockDeep<SyncEngineIpc>();
  const ipcRendererDriveServerWipMock = vi.mocked(ipcRendererDriveServerWip);

  const SUT = new FileDeleter(localFileSystem, repository, allParentFoldersStatusIsExists, ipc);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not nothing if the file its not found', async () => {
    const contentsId = ContentsIdMother.raw();

    repository.searchByPartial.mockReturnValueOnce(undefined);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(false);

    await SUT.run(contentsId);

    expect(repository.delete).not.toBeCalled();
  });

  it('does not delete a file if it has a parent already trashed', async () => {
    const file = FileMother.any();

    repository.searchByPartial.mockReturnValueOnce(file);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(false);

    await SUT.run(file.contentsId);

    expect(repository.delete).not.toBeCalled();
  });

  it('trashes the file if it exists and does not have any parent trashed', async () => {
    const file = FileMother.any();

    repository.searchByPartial.mockReturnValueOnce(file);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(ipcRendererDriveServerWipMock.invoke).toBeCalled();
  });

  it('trashes the file with the status trashed', async () => {
    const file = FileMother.any();

    ipcRendererDriveServerWipMock.invoke.mockResolvedValue({ data: true });
    repository.searchByPartial.mockReturnValueOnce(file);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(ipcRendererDriveServerWipMock.invoke).toBeCalledWith('storageDeleteFileByUuid', {
      uuid: file.uuid,
      workspaceToken: '',
    });
    expect(repository.update).toBeCalledWith(expect.objectContaining({ status: FileStatus.Trashed }));
  });
});
