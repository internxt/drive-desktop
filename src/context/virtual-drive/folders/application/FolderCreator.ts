import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { posix } from 'node:path';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath, pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { updateFolderStatus } from '@/backend/features/local-sync/placeholders/update-folder-status';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
};

export class FolderCreator {
  static async run({ ctx, path, absolutePath }: TProps) {
    const posixDir = pathUtils.dirname(path);
    const { data: parentUuid } = NodeWin.getFolderUuid({ ctx, path: posixDir });

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
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
      },
    });

    if (error) throw error;

    ctx.virtualDrive.convertToPlaceholder({ itemPath: path, id: `FOLDER:${folderDto.uuid}` });
    await updateFolderStatus({ ctx, path, absolutePath });
  }
}
