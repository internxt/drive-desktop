import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { basename } from 'node:path';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
};

export class FolderCreator {
  static async run({ ctx, path }: TProps) {
    const posixDir = pathUtils.dirname(path);
    const { data: parentInfo } = NodeWin.getFolderInfo({ ctx, path: posixDir });

    if (!parentInfo) {
      throw new FolderNotFoundError(posixDir);
    }

    const folderDto = await HttpRemoteFolderSystem.persist({
      ctx,
      parentUuid: parentInfo.uuid,
      plainName: basename(path),
      path,
    });

    const { error } = await ipcRendererSqlite.invoke('folderCreateOrUpdate', {
      folder: {
        ...folderDto,
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
      },
    });

    if (error) throw error;

    ctx.virtualDrive.convertToPlaceholder({ itemPath: path, id: `FOLDER:${folderDto.uuid}` });
  }
}
