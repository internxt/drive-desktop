import { LocalFolder } from '../../../context/local/localFolder/domain/LocalFolder';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';
import { RemoteTree } from '../remote-tree/traverser';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';

export type FoldersDiff = {
  added: Array<LocalFolder>;
  deleted: Array<Folder>;
  unmodified: Array<LocalFolder>;
  total: number;
};

type TProps = {
  local: LocalTree;
  remote: RemoteTree;
};

export function calculateFoldersDiff({ local, remote }: TProps) {
  const added: Array<LocalFolder> = [];
  const unmodified: Array<LocalFolder> = [];
  const deleted: Array<Folder> = [];

  Object.values(local.folders).forEach((folder) => {
    if (remote.folders[folder.path]) {
      unmodified.push(folder);
    } else {
      added.push(folder);
    }
  });

  Object.values(remote.folders).forEach((folder) => {
    // Already deleted
    if (folder.status !== FolderStatuses.EXISTS) return;

    if (!local.folders[folder.path]) {
      deleted.push(folder);
    }
  });

  const total = added.length + unmodified.length;

  return { added, deleted, unmodified, total };
}
