import { LocalFolder } from '../../../context/local/localFolder/domain/LocalFolder';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';

export type FoldersDiff = {
  added: Array<LocalFolder>;
  deleted: Array<ExtendedDriveFolder>;
  unmodified: Array<LocalFolder>;
  total: number;
};

type TProps = {
  local: LocalTree;
  remote: RemoteTree;
};

export function calculateFoldersDiff({ local, remote }: TProps) {
  const added: FoldersDiff['added'] = [];
  const unmodified: FoldersDiff['unmodified'] = [];
  const deleted: FoldersDiff['deleted'] = [];

  Object.values(local.folders).forEach((folder) => {
    if (remote.folders[folder.absolutePath]) {
      unmodified.push(folder);
    } else {
      added.push(folder);
    }
  });

  Object.values(remote.folders).forEach((folder) => {
    if (!local.folders[folder.absolutePath]) {
      deleted.push(folder);
    }
  });

  const total = added.length + unmodified.length;

  return { added, deleted, unmodified, total };
}
