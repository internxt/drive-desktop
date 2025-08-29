import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { getConfig, ProcessSyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath, pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { basename } from 'path';

type Props = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  contents: {
    id: ContentsId;
    size: number;
  };
};

export class FileCreator {
  constructor(private readonly remote: HttpRemoteFileSystem) {}

  async run({ ctx, path, absolutePath, contents }: Props) {
    try {
      const parentPath = pathUtils.dirname(path);
      const { data: folderUuid } = NodeWin.getFolderUuid({
        drive: ctx.virtualDrive,
        path: parentPath,
      });

      if (!folderUuid) {
        throw new FolderNotFoundError(parentPath);
      }

      const fileDto = await this.remote.persist({
        contentsId: contents.id,
        folderUuid,
        path,
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
        path,
        exc: error,
      });

      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        key: absolutePath,
        nameWithExtension: basename(path),
      });

      throw error;
    }
  }
}
