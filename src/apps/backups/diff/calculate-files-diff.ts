import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { RelativePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTree } from '../remote-tree/traverser';
import { applyDangled, isDangledApplied } from './is-dangled-applied';
import { logger } from '@/apps/shared/logger/logger';

export type FilesDiff = {
  added: Array<LocalFile>;
  deleted: Array<File>;
  modified: Map<LocalFile, File>;
  unmodified: Array<LocalFile>;
  total: number;
};

type TProps = {
  local: LocalTree;
  remote: RemoteTree;
};

export function calculateFilesDiff({ local, remote }: TProps) {
  const added: Array<LocalFile> = [];
  const modified: Map<LocalFile, File> = new Map();
  const unmodified: Array<LocalFile> = [];
  const deleted: Array<File> = [];

  const { isApplied } = isDangledApplied();

  Object.values(local.files).forEach((local) => {
    const remoteFile = remote.files[local.relativePath];

    if (!remoteFile) {
      added.push(local);
      return;
    }

    const remoteModificationTime = Math.trunc(remoteFile.updatedAt.getTime() / 1000);
    const localModificationTime = Math.trunc(local.modificationTime / 1000);

    const createdAt = remoteFile.createdAt.getTime();
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
    // Already deleted
    if (remoteFile.status.value !== FileStatuses.EXISTS) return;

    if (!local.files[remoteFile.path as RelativePath]) {
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
