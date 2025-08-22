import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';
import { applyDangled, isDangledApplied } from './is-dangled-applied';
import { logger } from '@/apps/shared/logger/logger';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';

export type FilesDiff = {
  added: Array<LocalFile>;
  deleted: Array<ExtendedDriveFile>;
  modified: Map<LocalFile, ExtendedDriveFile>;
  unmodified: Array<LocalFile>;
  total: number;
};

type TProps = {
  local: LocalTree;
  remote: RemoteTree;
};

export function calculateFilesDiff({ local, remote }: TProps) {
  const added: Array<LocalFile> = [];
  const modified: Map<LocalFile, ExtendedDriveFile> = new Map();
  const unmodified: Array<LocalFile> = [];
  const deleted: Array<ExtendedDriveFile> = [];

  const { isApplied } = isDangledApplied();

  Object.values(local.files).forEach((local) => {
    const remoteFile = remote.files[local.relativePath];

    if (!remoteFile) {
      added.push(local);
      return;
    }

    const remoteModificationTime = Math.trunc(new Date(remoteFile.updatedAt).getTime() / 1000);
    const localModificationTime = Math.trunc(local.modificationTime.getTime() / 1000);

    const createdAt = new Date(remoteFile.createdAt).getTime();
    const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
    const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

    if (!isApplied && createdAt >= startDate && createdAt <= endDate) {
      logger.debug({
        tag: 'BACKUPS',
        msg: 'Dangled file found',
        localPath: local.absolutePath,
        remoteId: remoteFile.contentsId,
      });

      modified.set(local, remoteFile);
      return;
    }

    if (remoteModificationTime < localModificationTime) {
      modified.set(local, remoteFile);
      return;
    }

    unmodified.push(local);
  });

  Object.values(remote.files).forEach((remoteFile) => {
    if (!local.files[remoteFile.path]) {
      deleted.push(remoteFile);
    }
  });

  applyDangled();

  const total = added.length + modified.size + deleted.length + unmodified.length;

  return {
    added,
    modified,
    deleted,
    unmodified,
    total,
  };
}
