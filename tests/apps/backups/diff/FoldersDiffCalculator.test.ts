import { FoldersDiffCalculator } from '../../../../src/apps/backups/diff/FoldersDiffCalculator';
import { LocalTreeMother } from '../../../context/local/tree/domain/LocalTreeMother';
import { RemoteTreeMother } from '../../../context/virtual-drive/tree/domain/RemoteTreeMother';
import { RemoteTree } from '../../../../src/context/virtual-drive/remoteTree/domain/RemoteTree';
import { LocalFolderMother } from '../../../context/local/localFolder/domain/LocalFolderMother';
import { AbsolutePathMother } from '../../../context/shared/infrastructure/AbsolutePathMother';
import { DateMother } from '../../../context/shared/domain/DateMother';
import { FolderMother } from '../../../context/virtual-drive/folders/domain/FolderMother';

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
    const local = LocalTreeMother.oneLevel(10);
    const originalRemote = RemoteTreeMother.oneLevel(10);

    // Ensure both trees have the same folders
    const updatedRemoteFolders = originalRemote.folders.map(
      (folder, index) => ({
        ...folder,
        path: local.folders[index].path,
      })
    );

    // Create a new root folder with all required properties
    const updatedRootFolder = FolderMother.fromPartial({
      ...originalRemote.root,
      path: originalRemote.root.path,
      // Add other necessary properties here
    });

    // If children are not part of Folder, manage them separately
    const folderHierarchy = {
      root: updatedRootFolder,
      children: updatedRemoteFolders,
    };

    // Create a new RemoteTree with the updated root folder
    const remote = new RemoteTree(folderHierarchy.root);

    const { unmodified } = FoldersDiffCalculator.calculate(local, remote);

    expect(unmodified.length).toBe(10);
    expect(unmodified).toStrictEqual(local.folders);
  });

  it('handles mixed additions, deletions, and unmodified folders', () => {
    const local = LocalTreeMother.oneLevel(15);
    const originalRemote = RemoteTreeMother.oneLevel(10);

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

    const remote = new RemoteTree(originalRemote.root);

    const { added, deleted, unmodified } = FoldersDiffCalculator.calculate(
      local,
      remote
    );

    expect(added.length).toBe(5);
    expect(deleted.length).toBe(0);
    expect(unmodified.length).toBe(10);

    const expectedAddedFolders = local.folders.slice(10, 15);
    expect(added).toStrictEqual(expectedAddedFolders);
  });
});
