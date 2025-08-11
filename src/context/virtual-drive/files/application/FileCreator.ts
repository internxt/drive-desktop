import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { SyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath, pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { basename } from 'path';

type Props = {
  ctx: SyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  contents: RemoteFileContents;
};

export class FileCreator {
  static async run({ ctx, path, absolutePath, contents }: Props) {
    try {
      const parentPath = pathUtils.dirname(path);
      const { data: parentUuid } = NodeWin.getFolderUuid({
        drive: virtualDrive,
        path: parentPath,
      });

      if (!parentUuid) {
        throw new FolderNotFoundError(parentPath);
      }

      const { error, data } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
        ctx,
        path,
        absolutePath,
        parentUuid,
        contents,
      });

      if (error) throw error;

      return data;
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
