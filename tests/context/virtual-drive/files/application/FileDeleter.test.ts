import { FileMother } from '../domain/FileMother';
import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { ContentsIdMother } from '../../contents/domain/ContentsIdMother';
import { AllParentFoldersStatusIsExists } from '../../../../../src/context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FileStatus } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';
import { mockDeep } from 'vitest-mock-extended';
import { FileRepository } from '@/context/virtual-drive/files/domain/FileRepository';
import { FolderRepository } from '@/context/virtual-drive/folders/domain/FolderRepository';
import { RemoteFileSystem } from '@/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { NodeWinLocalFileSystem } from '@/context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';

describe('File Deleter', () => {
  const repository = mockDeep<FileRepository>();
  const folderRepository = mockDeep<FolderRepository>();
  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(folderRepository);
  const localFileSystem = mockDeep<NodeWinLocalFileSystem>();
  const remoteFileSystem = mockDeep<RemoteFileSystem>();
  const ipc = mockDeep<SyncEngineIpc>();

  const SUT = new FileDeleter(remoteFileSystem, localFileSystem, repository, allParentFoldersStatusIsExists, ipc);

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

    expect(remoteFileSystem.trash).toBeCalled();
  });

  it('trashes the file with the status trashed', async () => {
    const file = FileMother.any();

    repository.searchByPartial.mockReturnValueOnce(file);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(remoteFileSystem.trash).toBeCalledWith(file.contentsId);
    expect(repository.update).toBeCalledWith(expect.objectContaining({ status: FileStatus.Trashed }));
  });
});
