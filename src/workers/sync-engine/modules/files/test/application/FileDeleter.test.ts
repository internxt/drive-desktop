import { AllParentFoldersStatusIsExists } from '../../../folders/application/AllParentFoldersStatusIsExists';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { PlaceholderCreatorMock } from '../../../placeholders/test/__mock__/PlaceholderCreatorMock';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FileDeleter } from '../../application/FileDeleter';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';
import { FileMother } from '../domain/FileMother';
import { FileStatus } from '../../domain/FileStatus';

describe('File Deleter', () => {
  let repository: FileRepositoryMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let placeholderCreator: PlaceholderCreatorMock;
  let ipc: IpcRendererSyncEngineMock;

  let SUT: FileDeleter;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    const folderRepository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      folderRepository
    );
    placeholderCreator = new PlaceholderCreatorMock();
    ipc = new IpcRendererSyncEngineMock();

    SUT = new FileDeleter(
      repository,
      allParentFoldersStatusIsExists,
      placeholderCreator,
      ipc
    );
  });

  it('does not trash a file if its not found', async () => {
    const contentsId = ContentsIdMother.raw();

    repository.mockSearch.mockReturnValueOnce(undefined);

    await expect(async () => await SUT.run(contentsId)).rejects.toThrow();
  });

  it('does not delete a file if it has a parent already trashed', async () => {
    const file = FileMother.any();

    repository.mockSearchByPartial.mockReturnValueOnce(file);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockReturnValueOnce(false);

    await SUT.run(file.contentsId);

    expect(repository.mockDelete).not.toBeCalled();
  });

  it('trashes the file if it exists and does not have any parent trashed', async () => {
    const file = FileMother.any();

    repository.mockSearchByPartial.mockReturnValueOnce(file);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(repository.mockDelete).toBeCalled();
  });

  it('trashes the file with the status trashed', async () => {
    const file = FileMother.any();

    repository.mockSearchByPartial.mockReturnValueOnce(file);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(file.contentsId);

    expect(repository.mockDelete).toBeCalledWith(
      expect.objectContaining({ status: FileStatus.Trashed })
    );
  });
});
