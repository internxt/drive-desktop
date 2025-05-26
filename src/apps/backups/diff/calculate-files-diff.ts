import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { RelativePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { FileStatus } from '../../../context/virtual-drive/files/domain/FileStatus';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';
import { NewRemoteTree } from '../remote-tree/traverser';
import { applyDangled, isDangledApplied } from './is-dangled-applied';

type TProps = {
  local: LocalTree;
  remote: NewRemoteTree;
};

export function calculateFilesDiff({ local, remote }: TProps) {
  const added: Array<LocalFile> = [];
  const modified: Map<LocalFile, File> = new Map();
  const dangled: Map<LocalFile, File> = new Map();
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
      dangled.set(local, remoteFile);
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
    if (remoteFile.status.value !== FileStatus.Exists.value) return;

    if (!local.files[remoteFile.path as RelativePath]) {
      deleted.push(remoteFile);
    }
  });

  applyDangled();

  const total = added.length + modified.size + deleted.length + unmodified.length;

  return {
    added,
    modified,
    dangled,
    deleted,
    unmodified,
    total,
  };
}
