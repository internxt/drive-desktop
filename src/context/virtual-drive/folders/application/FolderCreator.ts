import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { posix } from 'path';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { getConfig, SyncContext } from '@/apps/sync-engine/config';
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
    const posixDir = pathUtils.dirname(path);
    const { data: parentUuid } = NodeWin.getFolderUuid({
      drive: virtualDrive,
      path: posixDir,
    });

    if (!parentUuid) {
      throw new FolderNotFoundError(posixDir);
    }

    const folderDto = await HttpRemoteFolderSystem.persist({
      ctx,
      parentUuid,
      plainName: posix.basename(path),
      path,
    });

    const { error } = await ipcRendererSqlite.invoke('folderCreateOrUpdate', {
      folder: {
        ...folderDto,
        userUuid: getConfig().userUuid,
        workspaceId: getConfig().workspaceId,
      },
    });

    if (error) throw error;

    virtualDrive.convertToPlaceholder({
      itemPath: path,
      id: `FOLDER:${folderDto.uuid}`,
    });
  }
}
