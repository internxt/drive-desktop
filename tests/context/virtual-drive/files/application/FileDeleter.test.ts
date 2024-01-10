import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { FileMother } from '../domain/FileMother';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { LocalFileSystemMock } from '../__mocks__/LocalFileSystemMock';
import { IpcRendererSyncEngineMock } from '../../shared/__mock__/IpcRendererSyncEngineMock';
import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { FolderRepositoryMock } from '../../folders/__mocks__/FolderRepositoryMock';
import { ContentsIdMother } from '../../contents/domain/ContentsIdMother';
import { AllParentFoldersStatusIsExists } from '../../../../../src/context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';

describe('File Deleter', () => {
  let repository: FileRepositoryMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let remoteFileSystemMock: RemoteFileSystemMock;
  let localFilesSystemMock: LocalFileSystemMock;
  let ipc: IpcRendererSyncEngineMock;

  let SUT: FileDeleter;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    const folderRepository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      folderRepository
    );
    localFilesSystemMock = new LocalFileSystemMock();
    remoteFileSystemMock = new RemoteFileSystemMock();
    ipc = new IpcRendererSyncEngineMock();

    SUT = new FileDeleter(
      remoteFileSystemMock,
      localFilesSystemMock,
      repository,
      allParentFoldersStatusIsExists
    );
  });

  it('does not nothing if the file its not found', async () => {
    const contentsId = ContentsIdMother.raw();

    repository.searchByPartialMock.mockReturnValueOnce(undefined);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockReturnValueOnce(false);

    await SUT.run(contentsId);

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('does not delete a file if it has a parent already trashed', async () => {
    const file = FileMother.any();

    repository.searchByPartialMock.mockReturnValueOnce(file);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockReturnValueOnce(false);

    await SUT.run(file.contentsId);

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('trashes the file if it exists and does not have any parent trashed', async () => {
    const file = FileMother.any();

    repository.searchByPartialMock.mockReturnValueOnce(file);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(repository.deleteMock).toBeCalled();
  });

  it('trashes the file with the status trashed', async () => {
    const file = FileMother.any();

    repository.searchByPartialMock.mockReturnValueOnce(file);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(remoteFileSystemMock.trashMock).toBeCalledWith(file.contentsId);
    expect(repository.deleteMock).toBeCalledWith(file.contentsId);
  });
});
