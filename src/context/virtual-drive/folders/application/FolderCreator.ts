import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { SyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

type TProps = {
  ctx: SyncContext;
  path: RelativePath;
};

export class FolderCreator {
  static async run({ ctx, path }: TProps) {
    const parentPath = pathUtils.dirname(path);
    const { data: parentUuid } = NodeWin.getFolderUuid({
      drive: virtualDrive,
      path: parentPath,
    });

    if (!parentUuid) {
      throw new FolderNotFoundError(parentPath);
    }

    const { error, data } = await ipcRendererSqlite.invoke('folderCreateOrUpdate', {
      ctx,
      parentUuid,
      path,
    });

    if (error) throw error;

    virtualDrive.convertToPlaceholder({
      itemPath: path,
      id: `FOLDER:${data.uuid}`,
    });
  }
}
