import { RelativePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '../../../context/local/localFolder/domain/LocalFolder';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';

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
    if (remote.folders[folder.relativePath]) {
      unmodified.push(folder);
    } else {
      added.push(folder);
    }
  });

  Object.values(remote.folders).forEach((folder) => {
    if (!local.folders[folder.path as RelativePath]) {
      deleted.push(folder);
    }
  });

  const total = added.length + unmodified.length;

  return { added, deleted, unmodified, total };
}
