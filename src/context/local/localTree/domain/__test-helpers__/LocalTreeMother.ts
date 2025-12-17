import path from 'path';
import { AbsolutePath } from '../../../localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../LocalTree';
import { LocalFileMother } from '../../../localFile/domain/__test-helpers__/LocalFileMother';
import { LocalFolderMother } from '../../../localFolder/domain/__test-helpers__/LocalFolderMother';
import { FileNameMother } from '../../../../../context/shared/domain/__test-helpers__/FileNameMother';
import { FolderNameMother } from '../../../../../context/shared/domain/__test-helpers__/FolderNameMother';




export class LocalTreeMother {
  static onlyRoot(): LocalTree {
    const root = LocalFolderMother.any();

    const tree = new LocalTree(root);

    return tree;
  }

  static oneLevel(numberOfFiles: number): LocalTree {
    const tree = LocalTreeMother.onlyRoot();

    for (let i = 0; i < numberOfFiles; i++) {
      tree.addFile(
        tree.root,
        LocalFileMother.fromPartial({
          path: path.join(tree.root.path, FileNameMother.any()) as AbsolutePath,
        }),
      );
      tree.addFolder(
        tree.root,
        LocalFolderMother.fromPartial({
          path: path.join(tree.root.path, FolderNameMother.any()) as AbsolutePath,
        }),
      );
    }

    return tree;
  }
}
