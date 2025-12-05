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
    const { data: parentInfo, error: error1 } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (error1) {
      if (error1?.code === 'NOT_A_PLACEHOLDER') throw new FolderNotFoundError(parentPath);
      else throw error1;
    }

    const { data: folder, error: error2 } = await ipcRendererDriveServerWip.invoke('persistFolder', {
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
      parentUuid: parentInfo.uuid,
      plainName: basename(path),
      path,
    });

    if (error2) throw error2;

    await Addon.convertToPlaceholder({ path, placeholderId: `FOLDER:${folder.uuid}` });
  }
}
