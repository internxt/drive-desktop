import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';
import { applyDangled, isDangledApplied } from './is-dangled-applied';
import { logger } from '@/apps/shared/logger/logger';
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

  const { isApplied } = isDangledApplied();

  Object.values(local.files).forEach((local) => {
    const remoteFile = remote.files.get(local.path);

    if (!remoteFile) {
      added.push(local);
      return;
    }

    const createdAt = new Date(remoteFile.createdAt).getTime();
    const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
    const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

    if (!isApplied && createdAt >= startDate && createdAt <= endDate) {
      logger.debug({
        tag: 'BACKUPS',
        msg: 'Dangled file found',
        localPath: local.path,
        remoteId: remoteFile.contentsId,
      });

      modified.push({ local, remote: remoteFile });
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

  applyDangled();

  const total = added.length + modified.length + deleted.length + unmodified.length;

  return {
    added,
    modified,
    deleted,
    unmodified,
    total,
  };
}
