import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type FoldersDiff = {
  added: Array<AbsolutePath>;
  deleted: Array<ExtendedDriveFolder>;
  unmodified: Array<AbsolutePath>;
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

  for (const folder of local.folders) {
    if (remote.folders.has(folder)) {
      unmodified.push(folder);
    } else {
      added.push(folder);
    }
  }

  for (const folder of remote.folders.values()) {
    if (!local.folders.includes(folder.absolutePath)) {
      deleted.push(folder);
    }
  }

  const total = added.length + deleted.length + unmodified.length;

  return { added, deleted, unmodified, total };
}
