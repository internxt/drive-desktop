import { WebdavFolderFinder } from '../../application/WebdavFolderFinder';
import { WebdavFolderMover } from '../../application/WebdavFolderMover';
import { WebdavFolderMother } from '../domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../__mocks__/WebdavFolderRepositoryMock';

describe('Folder Mover', () => {
  let repository: WebdavFolderRepositoryMock;
  let folderFinder: WebdavFolderFinder;
  let SUT: WebdavFolderMover;

  beforeEach(() => {
    repository = new WebdavFolderRepositoryMock();
    folderFinder = new WebdavFolderFinder(repository);
    SUT = new WebdavFolderMover(repository, folderFinder);
  });

  it('Folders cannot be ovewrited', async () => {
    const folder = WebdavFolderMother.in(1, '/folderA/folderB');
    const destination = '/folderC/folderB';

    repository.mockSearch.mockImplementation(() =>
      WebdavFolderMother.in(2, destination)
    );

    try {
      const hasBeenOverriden = await SUT.run(folder, destination);
      expect(hasBeenOverriden).not.toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(repository.mockUpdateName).not.toBeCalled();
    expect(repository.mockUpdateParentDir).not.toBeCalled();
  });

  describe('Move', () => {
    it('moves a folder when the destination folder does not contain a folder with the same folder', async () => {
      const folder = WebdavFolderMother.in(1, '/folderA/folderB');
      const destination = '/folderC/folderB';
      const folderC = WebdavFolderMother.in(2, '/folderC');

      repository.mockSearch
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(folderC);

      await SUT.run(folder, destination);

      expect(repository.mockUpdateParentDir).toHaveBeenCalled();
      expect(repository.mockUpdateName).not.toHaveBeenCalled();
    });
  });

  describe('Rename', () => {
    it('when a folder is moved to same folder its renamed', async () => {
      const folderAId = 30010278;
      const folder = WebdavFolderMother.in(folderAId, '/folderA/folderB');
      const destination = '/folderA/folderC';

      repository.mockSearch
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(WebdavFolderMother.withId(folderAId));

      await SUT.run(folder, destination);

      expect(repository.mockUpdateName).toHaveBeenCalled();
      expect(repository.mockUpdateParentDir).not.toHaveBeenCalled();
    });
  });
});
