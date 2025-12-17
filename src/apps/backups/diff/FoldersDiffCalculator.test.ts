import { DateMother } from '../../../context/shared/domain/__test-helpers__/DateMother';
import { AbsolutePathMother } from './../../../context/shared/infrastructure/__test-helpers__/AbsolutePathMother';
import { RemoteTreeMother } from './../../../context/virtual-drive/remoteTree/domain/__test-helpers__/RemoteTreeMother';
import { FoldersDiffCalculator } from './FoldersDiffCalculator';
import { LocalTreeMother } from '../../../context/local/localTree/domain/__test-helpers__/LocalTreeMother';
import { LocalFolderMother } from '../../../context/local/localFolder/domain/__test-helpers__/LocalFolderMother';


describe('FoldersDiffCalculator', () => {
  it('groups folders as added when not found on the remote tree', () => {
    const expectedNumberOfFoldersToAdd = 24;
    const local = LocalTreeMother.oneLevel(expectedNumberOfFoldersToAdd);
    const remote = RemoteTreeMother.onlyRoot();

    const { added } = FoldersDiffCalculator.calculate(local, remote);

    const localFoldersWithoutRoot = local.folders.filter((folder) => folder.path !== local.root.path);

    expect(added.length).toBe(expectedNumberOfFoldersToAdd);
    expect(added).toStrictEqual(localFoldersWithoutRoot);
  });

  it('groups folders as deleted when not found on the local tree', () => {
    const expectedNumberOfFoldersToDelete = 88;
    const local = LocalTreeMother.onlyRoot();
    const remote = RemoteTreeMother.oneLevel(expectedNumberOfFoldersToDelete);

    const { deleted } = FoldersDiffCalculator.calculate(local, remote);

    const remoteFoldersWithoutRoot = remote.folders.filter((folder) => folder.path !== remote.root.path);

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

    const newFolders = [
      LocalFolderMother.fromPartial({
        path: AbsolutePathMother.anyFile(),
        modificationTime: DateMother.today().getTime(),
      }),
      LocalFolderMother.fromPartial({
        path: AbsolutePathMother.anyFile(),
        modificationTime: DateMother.today().getTime(),
      }),
      LocalFolderMother.fromPartial({
        path: AbsolutePathMother.anyFile(),
        modificationTime: DateMother.today().getTime(),
      }),
      LocalFolderMother.fromPartial({
        path: AbsolutePathMother.anyFile(),
        modificationTime: DateMother.today().getTime(),
      }),
      LocalFolderMother.fromPartial({
        path: AbsolutePathMother.anyFile(),
        modificationTime: DateMother.today().getTime(),
      }),
    ];

    newFolders.forEach((folder) => local.addFolder(local.root, folder));

    const { added, deleted, unmodified } = FoldersDiffCalculator.calculate(local, originalRemote);

    expect(added.length).toBe(expectedNumberOfAddedFolders);
    expect(deleted.length).toBe(0);
    expect(unmodified.length).toBe(expectedNumberOfUnmodifiedFolders + 1);
  });
});
