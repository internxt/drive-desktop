import path from 'path';
import { AbsolutePath } from '../../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../../../src/context/local/localTree/domain/LocalTree';
import { FileNameMother } from '../../../shared/domain/FileNameMother';
import { LocalFileMother } from '../../localFile/domain/LocalFileMother';
import { LocalFolderMother } from '../../localFolder/domain/LocalFolderMother';
import { FolderNameMother } from '../../../shared/domain/FolderNameMother';

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
        })
      );
      tree.addFolder(
        tree.root,
        LocalFolderMother.fromPartial({
          path: path.join(
            tree.root.path,
            FolderNameMother.any()
          ) as AbsolutePath,
        })
      );
    }

    return tree;
  }
}
