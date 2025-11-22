import { basename } from 'node:path';
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
    const { data: parentInfo } = NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (!parentInfo) {
      throw new FolderNotFoundError(parentPath);
    }

    const { data: folder, error } = await ipcRendererDriveServerWip.invoke('createFolder', {
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
      parentUuid: parentInfo.uuid,
      plainName: basename(path),
      path,
    });

    if (error) throw error;

    Addon.convertToPlaceholder({ path, placeholderId: `FOLDER:${folder.uuid}` });
  }
}
