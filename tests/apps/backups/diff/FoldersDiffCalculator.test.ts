import { FoldersDiffCalculator } from '../../../../src/apps/backups/diff/FoldersDiffCalculator';
import { LocalTreeMother } from '../../../context/local/tree/domain/LocalTreeMother';
import { RemoteTreeMother } from '../../../context/virtual-drive/tree/domain/RemoteTreeMother';
import { LocalFolderMother } from '../../../context/local/localFolder/domain/LocalFolderMother';
import { AbsolutePathMother } from '../../../context/shared/infrastructure/AbsolutePathMother';
import { DateMother } from '../../../context/shared/domain/DateMother';

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

  it('identifies unmodified folders correctly', () => {
    const expectedNumberOfUnmodifiedFolders = 10;
    const local = LocalTreeMother.oneLevel(expectedNumberOfUnmodifiedFolders);
    const remote = RemoteTreeMother.cloneFromLocal(local);

    const { unmodified } = FoldersDiffCalculator.calculate(local, remote);

    expect(unmodified.length).toBe(expectedNumberOfUnmodifiedFolders + 1);
    expect(unmodified).toStrictEqual(local.folders);
  });

  it('handles mixed additions, deletions, and unmodified folders', () => {
    const expectedNumberOfUnmodifiedFolders = 10;
    const expectedNumberOfAddedFolders = 5;
    const local = LocalTreeMother.oneLevel(expectedNumberOfUnmodifiedFolders);
    const originalRemote = RemoteTreeMother.cloneFromLocal(local);

    // Add 5 new folders to local using LocalFolderMother
    for (let i = 11; i <= 15; i++) {
      local.addFolder(
        local.root,
        LocalFolderMother.fromPartial({
          path: AbsolutePathMother.anyFile(),
          modificationTime: DateMother.today().getTime(),
        })
      );
    }

    const { added, deleted, unmodified } = FoldersDiffCalculator.calculate(
      local,
      originalRemote
    );

    expect(added.length).toBe(expectedNumberOfAddedFolders);
    expect(deleted.length).toBe(0);
    expect(unmodified.length).toBe(expectedNumberOfUnmodifiedFolders + 1);
  });
});
