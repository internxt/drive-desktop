import { FilePath } from '../domain/FilePath';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { getConfig, SyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

type Props = {
  ctx: SyncContext;
  filePath: FilePath;
  absolutePath: AbsolutePath;
  contents: RemoteFileContents;
};

export class FileCreator {
  static async run({ ctx, filePath, absolutePath, contents }: Props) {
    try {
      const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
      const { data: folderUuid } = NodeWin.getFolderUuid({
        drive: virtualDrive,
        path: posixDir,
      });

      if (!folderUuid) {
        throw new FolderNotFoundError(posixDir);
      }

      const fileDto = await HttpRemoteFileSystem.persist({
        ctx,
        contentsId: contents.id,
        folderUuid,
        path: filePath.value,
        size: contents.size,
      });

      const { error } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
        file: {
          ...fileDto,
          size: Number(fileDto.size),
          isDangledStatus: false,
          userUuid: getConfig().userUuid,
          workspaceId: getConfig().workspaceId,
        },
        bucket: getConfig().bucket,
        absolutePath,
      });

      if (error) throw error;

      return fileDto;
    } catch (error) {
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
}
