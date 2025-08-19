import { FilePath } from '../domain/FilePath';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import path from 'path';
import { CreateFileError } from '@/infra/drive-server-wip/services/files.service';

type Props = {
  filePath: FilePath;
  absolutePath: AbsolutePath;
  contents: RemoteFileContents;
};

type PersistAndIndexParams = {
  remote: HttpRemoteFileSystem;
  folderUuid: string;
  filePath: FilePath;
  contents: RemoteFileContents;
  absolutePath: AbsolutePath;
};

type EnsureParentFolderParams = {
  remote: HttpRemoteFileSystem;
  virtualDrive: VirtualDrive;
  posixDir: string;
};

export class FileCreator {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  async run({ filePath, absolutePath, contents }: Props) {
    try {
      const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
      const folderUuid = this.getFolderUuid({ posixPath: posixDir });

      if (!folderUuid) {
        throw new FolderNotFoundError(posixDir);
      }

      const fileDto = await this.persistAndIndex({
        remote: this.remote,
        folderUuid,
        filePath,
        contents,
        absolutePath,
      });

      return fileDto;
    } catch (error) {
      if (error instanceof CreateFileError) {
        const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
        const repaired = await this.ensureParentFolderExists({
          remote: this.remote,
          virtualDrive: this.virtualDrive,
          posixDir,
        });

        if (repaired) {
          const folderUuid = this.getFolderUuid({ posixPath: posixDir });
          if (folderUuid) {
            const fileDto = await this.persistAndIndex({
              remote: this.remote,
              folderUuid,
              filePath,
              contents,
              absolutePath,
            });
            return fileDto;
          }
        }
      }

      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error in file creator',
        filePath: filePath.value,
        exc: error,
      });

      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        key: absolutePath,
        nameWithExtension: filePath.nameWithExtension(),
      });

      throw error;
    }
  }

  private getFolderUuid({ posixPath }: { posixPath: string }): string | undefined {
    const { data: folderUuid } = NodeWin.getFolderUuid({
      drive: this.virtualDrive,
      path: posixPath,
    });
    return folderUuid;
  }

  private async persistAndIndex({ remote, folderUuid, filePath, contents, absolutePath }: PersistAndIndexParams) {
    const fileDto = await remote.persist({
      contentsId: contents.id,
      folderUuid,
      path: filePath.value,
      size: contents.size,
    });

    const cfg = getConfig();

    const { error } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
      file: {
        ...fileDto,
        size: Number(fileDto.size),
        isDangledStatus: false,
        userUuid: cfg.userUuid,
        workspaceId: cfg.workspaceId,
      },
      bucket: cfg.bucket,
      absolutePath,
    });

    if (error) throw error;

    return fileDto;
  }

  private async ensureParentFolderExists({ remote, virtualDrive, posixDir }: EnsureParentFolderParams): Promise<boolean> {
    const targetFolderName = path.posix.basename(posixDir);
    const grandParentFolder = PlatformPathConverter.getFatherPathPosix(posixDir);

    const { data: folderUuid } = NodeWin.getFolderUuid({
      drive: virtualDrive,
      path: posixDir,
    });
    const { data: parentUuid } = NodeWin.getFolderUuid({
      drive: virtualDrive,
      path: grandParentFolder,
    });

    if (!folderUuid || !parentUuid) return false;

    const remoteParentFolder = await remote.existParentFolder({
      plainName: targetFolderName,
      parentUuid,
      path: posixDir,
    });

    if (!remoteParentFolder) {
      const config = getConfig();
      await remote.restoreParentFolder({
        uuid: folderUuid,
        parentUuid: config.rootUuid,
        workspaceToken: config.workspaceToken,
      });

      await remote.renameParentFolder({
        uuid: folderUuid,
        name: targetFolderName,
        workspaceToken: config.workspaceToken,
      });
    }

    return true;
  }
}
