import { WebdavFolderDeleter } from '../../application/WebdavFolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';

describe('Folder deleter', () => {
  let repository: FolderRepositoryMock;
  let SUT: WebdavFolderDeleter;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    SUT = new WebdavFolderDeleter(repository);
  });

  it('trashes an existing folder', () => {
    const folder = FolderMother.exists();

    SUT.run(folder);

    expect(repository.mockTrash).toBeCalledWith(
      expect.objectContaining({
        status: FolderStatus.Trashed,
      })
    );
  });

  it('throws an error when trashing a folder already trashed', () => {
    const folder = FolderMother.trashed();

    SUT.run(folder).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.mockTrash).not.toBeCalled();
  });
});
