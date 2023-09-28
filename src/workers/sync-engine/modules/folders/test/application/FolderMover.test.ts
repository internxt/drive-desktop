import { FolderFinder } from '../../application/FolderFinder';
import { FolderMover } from '../../application/FolderMover';
import { FolderMother } from '../domain/FolderMother';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderPath } from '../../domain/FolderPath';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: FolderFinder;
  let SUT: FolderMover;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new FolderFinder(repository);

    SUT = new FolderMover(repository, folderFinder);
  });

  it('Folders cannot be overwrite', async () => {
    const folder = FolderMother.in(1, '/folderA/folderB');
    const destination = new FolderPath('/folderC/folderB');

    repository.mockSearch.mockImplementation(() =>
      FolderMother.in(2, destination.value)
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
      const destination = new FolderPath('/folderC/folderB');
      const folderC = FolderMother.in(2, '/folderC');

      repository.mockSearch
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(folderC);

      await SUT.run(folder, destination);

      expect(repository.mockUpdateParentDir).toHaveBeenCalled();
      expect(repository.mockUpdateName).not.toHaveBeenCalled();
    });
  });
});
