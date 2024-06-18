import { FoldersDiffCalculator } from '../../../../src/apps/backups/diff/FoldersDiffCalculator';
import { LocalTreeMother } from '../../../context/local/tree/domain/LocalTreeMother';
import { RemoteTreeMother } from '../../../context/virtual-drive/tree/domain/RemoteTreeMother';

describe('FoldersDiffCalculator', () => {
  it('groups folders as added when not found on the remote tree', () => {
    const expectedNumberOfFoldersToAdd = 24;
    const local = LocalTreeMother.oneLevel(expectedNumberOfFoldersToAdd);
    const remote = RemoteTreeMother.onlyRoot();

    const { added } = FoldersDiffCalculator.calculate(local, remote);

    const localFoldersWithoutRoot = local.folders.filter(
      (folder) => folder.path !== local.root.path
    );

    expect(added.length).toBe(expectedNumberOfFoldersToAdd);
    expect(added).toStrictEqual(localFoldersWithoutRoot);
  });

  it('groups folders as deleted when not found on the local tree', () => {
    const expectedNumberOfFoldersToDelete = 88;
    const local = LocalTreeMother.onlyRoot();
    const remote = RemoteTreeMother.oneLevel(expectedNumberOfFoldersToDelete);

    const { deleted } = FoldersDiffCalculator.calculate(local, remote);

    const remoteFoldersWithoutRoot = remote.folders.filter(
      (folder) => folder.path !== remote.root.path
    );

    expect(deleted.length).toBe(expectedNumberOfFoldersToDelete);
    expect(deleted).toStrictEqual(remoteFoldersWithoutRoot);
  });
});
