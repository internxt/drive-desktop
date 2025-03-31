import path from 'path';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../context/local/localTree/domain/LocalTree';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { RemoteTree } from '../../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { relativeV2 } from '../utils/relative';
import { FileStatus } from '../../../context/virtual-drive/files/domain/FileStatus';
import Store from 'electron-store';
import { logger } from '@/apps/shared/logger/logger';

export type FilesDiff = {
  added: Array<LocalFile>;
  deleted: Array<File>;
  modified: Map<LocalFile, File>;
  unmodified: Array<LocalFile>;
  total: number;
};

const store = new Store();
const IS_PATCH_2_5_1_APPLIED = 'patch-executed-2-5-1';

export class DiffFilesCalculator {
  static calculate(local: LocalTree, remote: RemoteTree): FilesDiff {
    const added: Array<LocalFile> = [];
    const modified: Map<LocalFile, File> = new Map();
    const unmodified: Array<LocalFile> = [];

    const rootPath = local.root.path;

    local.files.forEach((local) => {
      const remotePath = relativeV2(rootPath, local.path);

      const remoteExists = remote.has(remotePath);

      if (!remoteExists) {
        added.push(local);
        return;
      }

      const remoteNode = remote.get(remotePath);

      if (remoteNode.isFolder()) {
        logger.debug({ msg: 'Folder should be a file', remoteNodeName: remoteNode.name });
        return;
      }

      const remoteModificationTime = Math.trunc(remoteNode.updatedAt.getTime() / 1000);
      const localModificationTime = Math.trunc(local.modificationTime / 1000);

      const createdAt = remoteNode.createdAt.getTime();
      const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
      const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

      if (!store.get(IS_PATCH_2_5_1_APPLIED, false) && createdAt >= startDate && createdAt <= endDate) {
        logger.debug({ msg: 'Possible Dangled File', remoteNodeName: remoteNode.name });
        modified.set(local, remoteNode);
        return;
      }

      if (remoteModificationTime < localModificationTime) {
        modified.set(local, remoteNode);
        return;
      }

      unmodified.push(local);
    });

    store.set(IS_PATCH_2_5_1_APPLIED, true);

    // si el archivo no existe en local, se marca como eliminado,
    // pero si tiene un status de deleted, no se marca como eliminado
    const deleted = remote.files.filter((file) => {
      if (file.status !== FileStatus.Exists) {
        return false;
      }
      logger.debug({ msg: 'Checking if file is deleted', path: file.path });
      return !local.has(path.join(rootPath, file.path) as AbsolutePath);
    });

    const total = added.length + modified.size + deleted.length + unmodified.length;

    return {
      added,
      modified,
      deleted,
      unmodified,
      total,
    };
  }
}
