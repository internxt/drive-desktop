import path, { relative } from 'path';
import { FolderStatus } from '../../../folders/domain/FolderStatus';
import { RemoteTree } from '../RemoteTree';
import { FileMother } from '../../../files/domain/__test-helpers__/FileMother';
import { LocalTree } from '../../../../local/localTree/domain/LocalTree';
import { FolderMother } from '../../../folders/domain/__test-helpers__/FolderMother';
import { FileNameMother } from '../../../../../context/shared/domain/__test-helpers__/FileNameMother';
import { FolderNameMother } from '../../../../../context/shared/domain/__test-helpers__/FolderNameMother';

export class RemoteTreeMother {
  static onlyRoot(): RemoteTree {
    const root = FolderMother.fromPartial({
      parentId: null,
      path: '/',
      status: FolderStatus.Exists.value,
    });

    const tree = new RemoteTree(root);

    return tree;
  }

  static oneLevel(numberOfFiles: number): RemoteTree {
    const tree = RemoteTreeMother.onlyRoot();

    for (let i = 0; i < numberOfFiles; i++) {
      tree.addFile(
        tree.root,
        FileMother.fromPartial({
          path: path.join(tree.root.path, FileNameMother.any()),
        }),
      );
      tree.addFolder(
        tree.root,
        FolderMother.fromPartial({
          path: path.join(tree.root.path, FolderNameMother.any()),
        }),
      );
    }

    return tree;
  }

  static cloneFromLocal(local: LocalTree): RemoteTree {
    const remote = RemoteTreeMother.onlyRoot();

    local.files.forEach((file) =>
      remote.addFile(
        remote.root,
        FileMother.fromPartial({
          path: path.join(remote.root.path, relative(local.root.path, file.path)),
        }),
      ),
    );

    local.folders.forEach((folder) => {
      if (folder.path === local.root.path) {
        return;
      }

      remote.addFolder(
        remote.root,
        FolderMother.fromPartial({
          path: path.join(remote.root.path, relative(local.root.path, folder.path)),
        }),
      );
    });

    return remote;
  }
}
