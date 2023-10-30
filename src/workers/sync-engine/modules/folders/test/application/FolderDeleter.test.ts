import { FolderDeleter } from '../../application/FolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { AllParentFoldersStatusIsExists } from '../../application/AllParentFoldersStatusIsExists';
import { PlaceholderCreatorMock } from '../../../placeholders/test/__mock__/PlaceholderCreatorMock';
import { FolderInternxtFileSystemMock } from '../__mocks__/FolderFileSystemMock';

describe('Folder deleter', () => {
  let fileSystem: FolderInternxtFileSystemMock;
  let repository: FolderRepositoryMock;
  let placeholderCreator: PlaceholderCreatorMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let SUT: FolderDeleter;

  beforeEach(() => {
    fileSystem = new FolderInternxtFileSystemMock();
    repository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      repository
    );
    placeholderCreator = new PlaceholderCreatorMock();
    SUT = new FolderDeleter(
      fileSystem,
      repository,
      allParentFoldersStatusIsExists,
      placeholderCreator
    );
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartialMock.mockReturnValueOnce(folder);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(true);

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
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(true);

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
      .mockResolvedValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('recreates the placeholder if the deletion fails', async () => {
    const folder = FolderMother.exists();

    repository.searchByPartialMock.mockReturnValueOnce(folder);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockResolvedValueOnce(true);
    repository.deleteMock.mockRejectedValue(
      new Error('Error during the deletion')
    );

    await SUT.run(folder.uuid);

    expect(placeholderCreator.folderMock).toBeCalledWith(folder);
  });
});
