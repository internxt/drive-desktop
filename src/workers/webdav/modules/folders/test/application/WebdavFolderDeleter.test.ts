import { WebdavFolderDeleter } from '../../application/WebdavFolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { WebdavFolderMother } from '../domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../__mocks__/WebdavFolderRepositoryMock';

describe('Folder deleter', () => {
  let repository: WebdavFolderRepositoryMock;
  let SUT: WebdavFolderDeleter;

  beforeEach(() => {
    repository = new WebdavFolderRepositoryMock();
    SUT = new WebdavFolderDeleter(repository);
  });

  it('trashes an existing folder', () => {
    const folder = WebdavFolderMother.exists();

    SUT.run(folder);

    expect(repository.mockTrash).toBeCalledWith(
      expect.objectContaining({
        status: FolderStatus.Trashed,
      })
    );
  });

  it('throws an error when trashing a folder already trashed', () => {
    const folder = WebdavFolderMother.trashed();

    SUT.run(folder).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.mockTrash).not.toBeCalled();
  });
});
