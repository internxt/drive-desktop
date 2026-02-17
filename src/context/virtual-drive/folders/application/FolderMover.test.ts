import { ParentFolderFinder } from './ParentFolderFinder';
import { FolderMover } from './FolderMover';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import path from 'path';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';
import { FolderDescendantsPathUpdater } from './FolderDescendantsPathUpdater';
import * as moveFolderModule from '../../../../infra/drive-server/services/folder/services/move-folder';
import { call, partialSpyOn } from 'tests/vitest/utils.helper';

describe('Folder Mover', () => {
  let repository: FolderRepositoryMock;
  let folderFinder: ParentFolderFinder;
  let descendantsPathUpdater: FolderDescendantsPathUpdater;
  let SUT: FolderMover;

  const moveFolderMock = partialSpyOn(moveFolderModule, 'moveFolder');

  const root = FolderMother.root();

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    folderFinder = new ParentFolderFinder(repository);

    descendantsPathUpdater = {
      syncDescendants: vi.fn().mockResolvedValue(undefined),
    } as unknown as FolderDescendantsPathUpdater;

    SUT = new FolderMover(repository, folderFinder, descendantsPathUpdater);
  });

  it('Folders cannot be overwrite', async () => {
    const folder = FolderMother.fromPartial({
      parentId: 1,
      path: '/folderA/folderB',
    });
    const destination = new FolderPath('/folderC/folderB');

    repository.matchingPartialMock.mockImplementation(() =>
      FolderMother.fromPartial({ parentId: 2, path: destination.value }),
    );

    try {
      const hasBeenOverwritten = await SUT.run(folder, destination);
      expect(hasBeenOverwritten).not.toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(repository.updateMock).not.toBeCalled();
  });

  describe('Move', () => {
    it('moves a folder when the destination folder does not contain a folder with the same folder', async () => {
      const originalParent = FolderMother.createChildForm(root);
      const parentDestination = FolderMother.createChildForm(root);

      const original = FolderMother.createChildForm(originalParent);

      const destinationPath = new FolderPath(path.join(parentDestination.path, original.name));

      moveFolderMock.mockResolvedValue({ data: {} as any });

      repository.matchingPartialMock.mockReturnValueOnce([]).mockReturnValueOnce([parentDestination]);

      await SUT.run(original, destinationPath);

      expect(repository.updateMock).toBeCalled();
    });

    it('calls moveFolder with the correct params', async () => {
      const originalParent = FolderMother.createChildForm(root);
      const parentDestination = FolderMother.createChildForm(root);

      const original = FolderMother.createChildForm(originalParent);

      const destinationPath = new FolderPath(path.join(parentDestination.path, original.name));

      moveFolderMock.mockResolvedValue({ data: {} as any });

      repository.matchingPartialMock.mockReturnValueOnce([]).mockReturnValueOnce([parentDestination]);

      await SUT.run(original, destinationPath);

      call(moveFolderMock).toMatchObject({
        uuid: original.uuid,
        destinationFolder: parentDestination.uuid,
      });
    });

    it('throws when moveFolder returns an error', async () => {
      const originalParent = FolderMother.createChildForm(root);
      const parentDestination = FolderMother.createChildForm(root);

      const original = FolderMother.createChildForm(originalParent);

      const destinationPath = new FolderPath(path.join(parentDestination.path, original.name));

      const error = new Error('move failed');
      moveFolderMock.mockResolvedValue({ error } as any);

      repository.matchingPartialMock.mockReturnValueOnce([]).mockReturnValueOnce([parentDestination]);

      await expect(SUT.run(original, destinationPath)).rejects.toBe(error);

      expect(repository.updateMock).not.toBeCalled();
    });
  });
});
