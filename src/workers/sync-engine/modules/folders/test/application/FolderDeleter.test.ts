import { FolderDeleter } from '../../application/FolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { ParentFoldersExistForDeletion } from '../../application/ParentFoldersExistForDeletion';
import { PlaceholderCreatorMock } from '../../../placeholders/test/__mock__/PlaceholderCreatorMock';

describe('Folder deleter', () => {
  let repository: FolderRepositoryMock;
  let parentFoldersExistForDeletion: ParentFoldersExistForDeletion;
  let SUT: FolderDeleter;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    parentFoldersExistForDeletion = new ParentFoldersExistForDeletion(
      repository
    );
    const placeholderCreator = new PlaceholderCreatorMock();
    SUT = new FolderDeleter(
      repository,
      parentFoldersExistForDeletion,
      placeholderCreator
    );
  });

  it('trashes an existing folder', () => {
    const folder = FolderMother.exists();

    repository.mockSearchByPartial.mockReturnValueOnce(folder);
    jest.spyOn(parentFoldersExistForDeletion, 'run').mockReturnValueOnce(true);

    SUT.run(folder.uuid);

    expect(repository.mockTrash).toBeCalledWith(
      expect.objectContaining({
        status: FolderStatus.Trashed,
      })
    );
  });

  it('throws an error when trashing a folder already trashed', () => {
    const folder = FolderMother.trashed();

    SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.mockTrash).not.toBeCalled();
  });
});
