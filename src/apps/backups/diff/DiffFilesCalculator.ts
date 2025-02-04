import path from 'path';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../context/local/localTree/domain/LocalTree';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { RemoteTree } from '../../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { relativeV2 } from '../utils/relative';
import Logger from 'electron-log';
import { FileStatus } from '../../../context/virtual-drive/files/domain/FileStatus';

export type FilesDiff = {
  added: Array<LocalFile>;
  deleted: Array<File>;
  modified: Map<LocalFile, File>;
  unmodified: Array<LocalFile>;
  total: number;
};

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
        Logger.debug('Folder should be a file', remoteNode.name);
        return;
      }

      const remoteModificationTime = Math.trunc(
        remoteNode.updatedAt.getTime() / 1000
      );
      const localModificationTime = Math.trunc(local.modificationTime / 1000);

      if (remoteModificationTime < localModificationTime) {
        modified.set(local, remoteNode);
        return;
      }

      unmodified.push(local);
    });

    // si el archivo no existe en local, se marca como eliminado,
    // pero si tiene un status de deleted, no se marca como eliminado
    const deleted = remote.files.filter((file) => {
      if (file.status !== FileStatus.Exists) {
        return false;
      }
      Logger.debug('Checking if file is deleted', file.path);
      return !local.has(path.join(rootPath, file.path) as AbsolutePath);
    });

    const total =
      added.length + modified.size + deleted.length + unmodified.length;

    return {
      added,
      modified,
      deleted,
      unmodified,
      total,
    };
  }
}
