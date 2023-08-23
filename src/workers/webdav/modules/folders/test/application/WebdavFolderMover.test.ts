import { WebdavFolderFinder } from '../../application/WebdavFolderFinder';
import { WebdavFolderMover } from '../../application/WebdavFolderMover';
import { WebdavFolderRenamer } from '../../application/WebdavFolderRenamer';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: WebdavFolderFinder;
  let folderRenamer: WebdavFolderRenamer;
  let ipc: WebdavIpcMock;
  let SUT: WebdavFolderMover;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new WebdavFolderFinder(repository);
    ipc = new WebdavIpcMock();
    folderRenamer = new WebdavFolderRenamer(repository, ipc);

    SUT = new WebdavFolderMover(repository, folderFinder, folderRenamer);
  });

  it('Folders cannot be ovewrited', async () => {
    const folder = FolderMother.in(1, '/folderA/folderB');
    const destination = '/folderC/folderB';

    repository.mockSearch.mockImplementation(() =>
      FolderMother.in(2, destination)
    );

    try {
      const hasBeenOverwritten = await SUT.run(folder, destination);
      expect(hasBeenOverwritten).not.toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(repository.mockUpdateName).not.toBeCalled();
    expect(repository.mockUpdateParentDir).not.toBeCalled();
  });

  describe('Move', () => {
    it('moves a folder when the destination folder does not contain a folder with the same folder', async () => {
      const folder = FolderMother.in(1, '/folderA/folderB');
      const destination = '/folderC/folderB';
      const folderC = FolderMother.in(2, '/folderC');

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
      const folder = FolderMother.in(folderAId, '/folderA/folderB');
      const destination = '/folderA/folderC';

      repository.mockSearch
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(FolderMother.withId(folderAId));

      await SUT.run(folder, destination);

      expect(repository.mockUpdateName).toHaveBeenCalled();
      expect(repository.mockUpdateParentDir).not.toHaveBeenCalled();
    });
  });
});
