import { RelativePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '../../../context/local/localFolder/domain/LocalFolder';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { RemoteTree } from '../remote-tree/domain/RemoteTree';
import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';

export type FoldersDiff = {
  added: Array<LocalFolder>;
  deleted: Array<Folder>;
  unmodified: Array<LocalFolder>;
  total: number;
};

export class FoldersDiffCalculator {
  static calculate(local: LocalTree, remote: RemoteTree): FoldersDiff {
    const added: Array<LocalFolder> = [];
    const unmodified: Array<LocalFolder> = [];
    const deleted: Array<Folder> = [];

    Object.values(local.folders).forEach((folder) => {
      if (remote.has(folder.relativePath)) {
        unmodified.push(folder);
      } else {
        added.push(folder);
      }
    });

    Object.values(remote.folders).forEach((folder) => {
      // Already deleted
      if (folder.status !== FolderStatuses.EXISTS) return;

      if (!local.folders[folder.path as RelativePath]) {
        deleted.push(folder);
      }
    });

    const total = added.length + unmodified.length;

    return { added, deleted, unmodified, total };
  }
}
