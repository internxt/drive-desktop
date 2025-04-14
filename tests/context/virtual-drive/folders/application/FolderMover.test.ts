import { mockDeep } from 'vitest-mock-extended';
import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../../src/context/virtual-drive/folders/application/FolderMover';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderMother } from '../domain/FolderMother';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';

describe('Folder Mover', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const folderFinder = new FolderFinder(repository);
  const remoteFolderSystem = mockDeep<HttpRemoteFolderSystem>();
  const SUT = new FolderMover(repository, remoteFolderSystem, folderFinder);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('Folders cannot be overwrite', async () => {
    const folder = FolderMother.in(1, '/folderA/folderB');
    const destination = new FolderPath('/folderC/folderB');

    repository.searchByPartial.mockImplementation(() => FolderMother.in(2, destination.value));

    try {
      const hasBeenOverwritten = await SUT.run(folder, destination);
      expect(hasBeenOverwritten).not.toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(repository.update).not.toBeCalled();
  });

  describe('Move', () => {
    it('moves a folder when the destination folder does not contain a folder with the same folder', async () => {
      const folder = FolderMother.in(1, '/folderA/folderB');
      const destination = new FolderPath('/folderC/folderB');
      const folderC = FolderMother.in(2, '/folderC');

      repository.searchByPartial.mockReturnValueOnce(undefined).mockReturnValueOnce(folderC);

      await SUT.run(folder, destination);

      expect(repository.update).toHaveBeenCalled();
    });
  });
});
