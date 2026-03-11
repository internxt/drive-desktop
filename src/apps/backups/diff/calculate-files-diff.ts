import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { StatItem } from '@/infra/file-system/services/stat-readdir';

export type FilesDiff = {
  added: Array<StatItem>;
  deleted: Array<ExtendedDriveFile>;
  modified: Array<{ local: StatItem; remote: ExtendedDriveFile }>;
  unmodified: Array<StatItem>;
  total: number;
};

type TProps = {
  local: LocalTree;
  remote: RemoteTree;
};

export function calculateFilesDiff({ local, remote }: TProps) {
  const added: FilesDiff['added'] = [];
  const modified: FilesDiff['modified'] = [];
  const unmodified: FilesDiff['unmodified'] = [];
  const deleted: FilesDiff['deleted'] = [];

  Object.values(local.files).forEach((local) => {
    const remoteFile = remote.files.get(local.path);

    if (!remoteFile) {
      added.push(local);
      return;
    }

    if (remoteFile.size !== local.stats.size) {
      modified.push({ local, remote: remoteFile });
      return;
    }

    unmodified.push(local);
  });

  for (const remoteFile of remote.files.values()) {
    if (!local.files[remoteFile.absolutePath]) {
      deleted.push(remoteFile);
    }
  }

  const total = added.length + modified.length + deleted.length + unmodified.length;

  return {
    added,
    modified,
    deleted,
    unmodified,
    total,
  };
}
