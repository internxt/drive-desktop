import { FolderDeleter } from '../../application/FolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { AllParentFoldersStatusIsExists } from '../../application/AllParentFoldersStatusIsExists';
import { PlaceholderCreatorMock } from '../../../placeholders/test/__mock__/PlaceholderCreatorMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';

describe('Folder deleter', () => {
  let repository: FolderRepositoryMock;
  let placeholderCreator: PlaceholderCreatorMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let remote: FolderRemoteFileSystemMock;
  let SUT: FolderDeleter;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      repository
    );
    placeholderCreator = new PlaceholderCreatorMock();
    new FolderRemoteFileSystemMock();
    SUT = new FolderDeleter(
      repository,
      remote,
      allParentFoldersStatusIsExists,
      placeholderCreator
    );
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartialMock.mockReturnValueOnce(folder);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid);

    expect(repository.deleteMock).toBeCalledWith(
      expect.objectContaining({
        status: FolderStatus.Trashed,
      })
    );
  });

  it('throws an error when trashing a folder already trashed', async () => {
    const folder = FolderMother.trashed();

    repository.searchByPartialMock.mockReturnValueOnce(folder);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('does not delete the folder if a higher folder is already deleted ', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartialMock.mockReturnValueOnce(folder);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockReturnValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('recreates the placeholder if the deletion fails', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartialMock.mockReturnValueOnce(folder);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);
    repository.deleteMock.mockRejectedValue(
      new Error('Error during the deletion')
    );

    await SUT.run(folder.uuid);

    expect(placeholderCreator.folderMock).toBeCalledWith(folder);
  });
});
