import path from 'path';
import { FolderStatus } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import { RemoteTree } from '../../../../../src/context/virtual-drive/remoteTree/domain/RemoteTree';
import { FileNameMother } from '../../../shared/domain/FileNameMother';
import { FileMother } from '../../files/domain/FileMother';
import { FolderMother } from '../../folders/domain/FolderMother';
import { FolderNameMother } from '../../../shared/domain/FolderNameMother';

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
        })
      );
      tree.addFolder(
        tree.root,
        FolderMother.fromPartial({
          path: path.join(tree.root.path, FolderNameMother.any()),
        })
      );
    }

    return tree;
  }
}
