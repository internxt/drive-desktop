import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { FileMother } from '../domain/FileMother';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { LocalFileSystemMock } from '../__mocks__/LocalFileSystemMock';
import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { FolderRepositoryMock } from '../../folders/__mocks__/FolderRepositoryMock';
import { ContentsIdMother } from '../../contents/domain/ContentsIdMother';
import { AllParentFoldersStatusIsExists } from '../../../../../src/context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FileSyncNotifierMock } from '../__mocks__/FileSyncNotifierMock';
import { FileStatus } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';

describe('File Deleter', () => {
  let repository: FileRepositoryMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let remoteFileSystemMock: RemoteFileSystemMock;
  let localFilesSystemMock: LocalFileSystemMock;
  let notifier: FileSyncNotifierMock;

  let SUT: FileDeleter;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    const folderRepository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      folderRepository
    );
    localFilesSystemMock = new LocalFileSystemMock();
    remoteFileSystemMock = new RemoteFileSystemMock();
    notifier = new FileSyncNotifierMock();

    SUT = new FileDeleter(
      remoteFileSystemMock,
      localFilesSystemMock,
      repository,
      allParentFoldersStatusIsExists,
      notifier
    );
  });

  it('does not nothing if the file its not found', async () => {
    const contentsId = ContentsIdMother.primitive();

    repository.matchingPartialMock.mockReturnValueOnce([]);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(false);

    await SUT.run(contentsId);

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('does not delete a file if it has a parent already trashed', async () => {
    const file = FileMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([file]);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(false);

    await SUT.run(file.contentsId);

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('trashes the file if it exists and does not have any parent trashed', async () => {
    const file = FileMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([file]);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(true);

    await SUT.run(file.contentsId);

    expect(remoteFileSystemMock.trashMock).toBeCalled();
  });

  it('trashes the file with the status trashed', async () => {
    const file = FileMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([file]);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(true);

    await SUT.run(file.contentsId);

    expect(remoteFileSystemMock.trashMock).toBeCalledWith(file.contentsId);
    expect(repository.updateMock).toBeCalledWith(
      expect.objectContaining({ status: FileStatus.Trashed })
    );
  });
});
