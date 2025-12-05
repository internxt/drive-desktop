import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export class FolderCreator {
  static async run({ ctx, path }: TProps) {
    const parentPath = pathUtils.dirname(path);
    const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (!parentInfo) {
      throw new FolderNotFoundError(parentPath);
    }

    const { data: folder, error } = await ipcRendererDriveServerWip.invoke('persistFolder', {
      ctx: {
        bucket: ctx.bucket,
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
        workspaceToken: ctx.workspaceToken,
      },
      path,
      parentUuid: parentInfo.uuid,
    });

    if (error) throw error;

    await Addon.convertToPlaceholder({ path, placeholderId: `FOLDER:${folder.uuid}` });
  }
}
