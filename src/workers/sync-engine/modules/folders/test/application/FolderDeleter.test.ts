import { FolderDeleter } from '../../application/FolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { AllParentFoldersStatusIsExists } from '../../application/AllParentFoldersStatusIsExists';
import { PlaceholderCreatorMock } from '../../../placeholders/test/__mock__/PlaceholderCreatorMock';

describe('Folder deleter', () => {
  let repository: FolderRepositoryMock;
  let placeholderCreator: PlaceholderCreatorMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let SUT: FolderDeleter;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      repository
    );
    placeholderCreator = new PlaceholderCreatorMock();
    SUT = new FolderDeleter(
      repository,
      allParentFoldersStatusIsExists,
      placeholderCreator
    );
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    repository.mockSearchByPartial.mockReturnValueOnce(folder);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid);

    expect(repository.mockTrash).toBeCalledWith(
      expect.objectContaining({
        status: FolderStatus.Trashed,
      })
    );
  });

  it('throws an error when trashing a folder already trashed', async () => {
    const folder = FolderMother.trashed();

    repository.mockSearchByPartial.mockReturnValueOnce(folder);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.mockTrash).not.toBeCalled();
  });

  it('does not delete the folder if a higher folder is already deleted ', async () => {
    const folder = FolderMother.exists();

    repository.mockSearchByPartial.mockReturnValueOnce(folder);
    jest
      .spyOn(allParentFoldersStatusIsExists, 'run')
      .mockReturnValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.mockTrash).not.toBeCalled();
  });

  it('recreates the placeholder if the deletion fails', async () => {
    const folder = FolderMother.exists();

    repository.mockSearchByPartial.mockReturnValueOnce(folder);
    jest.spyOn(allParentFoldersStatusIsExists, 'run').mockReturnValueOnce(true);
    repository.mockTrash.mockRejectedValue(
      new Error('Error during the deletion')
    );

    await SUT.run(folder.uuid);

    expect(placeholderCreator.folderMock).toBeCalledWith(folder);
  });
});
