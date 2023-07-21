import { WebdavFolderDeleter } from '../../application/WebdavFolderDeleter';
import { FolderStatus } from '../../domain/FolderStatus';
import { WebdavFolderMother } from '../domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../__mocks__/WebdavFolderRepositoryMock';
import { InMemoryItemsMock } from '../../../items/test/__mocks__/InMemoryItemsMock';

describe('Folder deleter', () => {
  let repository: WebdavFolderRepositoryMock;
  let inMemoryItems: InMemoryItemsMock;
  let SUT: WebdavFolderDeleter;

  beforeEach(() => {
    repository = new WebdavFolderRepositoryMock();
    inMemoryItems = new InMemoryItemsMock();
    SUT = new WebdavFolderDeleter(repository, inMemoryItems);
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
