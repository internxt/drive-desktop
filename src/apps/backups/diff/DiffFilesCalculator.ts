import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { RelativePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { RemoteTree } from '../remote-tree/domain/RemoteTree';
import { FileStatus } from '../../../context/virtual-drive/files/domain/FileStatus';
import Store from 'electron-store';
import { logger } from '@/apps/shared/logger/logger';
import { LocalTree } from '@/context/local/localTree/application/LocalTreeBuilder';

export type FilesDiff = {
  added: Array<LocalFile>;
  deleted: Array<File>;
  modified: Map<LocalFile, File>;
  unmodified: Array<LocalFile>;
  dangled: Map<LocalFile, File>;
  total: number;
};

const store = new Store();
const PATCH_2_5_1 = 'patch-executed-2-5-1';

export class DiffFilesCalculator {
  static calculate(local: LocalTree, remote: RemoteTree): FilesDiff {
    const added: Array<LocalFile> = [];
    const modified: Map<LocalFile, File> = new Map();
    const dangled: Map<LocalFile, File> = new Map();
    const unmodified: Array<LocalFile> = [];
    const deleted: Array<File> = [];

    const isPatchApplied = store.get(PATCH_2_5_1, false);

    Object.values(local.files).forEach((local) => {
      const remoteNode = remote.get(local.relativePath);

      if (!remoteNode) {
        added.push(local);
        return;
      }

      if (remoteNode.isFolder()) {
        logger.debug({ msg: 'Folder should be a file', remoteNodeName: remoteNode.name });
        return;
      }

      const remoteModificationTime = Math.trunc(remoteNode.updatedAt.getTime() / 1000);
      const localModificationTime = Math.trunc(local.modificationTime / 1000);

      const createdAt = remoteNode.createdAt.getTime();
      const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
      const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

      if (!isPatchApplied && createdAt >= startDate && createdAt <= endDate) {
        logger.debug({ msg: 'Possible Dangled File', remoteNodeName: remoteNode.name });
        dangled.set(local, remoteNode);
        return;
      }

      if (remoteModificationTime < localModificationTime) {
        modified.set(local, remoteNode);
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

    store.set(PATCH_2_5_1, true);

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
}
