import { SyncContext } from '@/apps/sync-engine/config';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { getParentUuid } from '../../files/application/get-parent-uuid';

type TProps = {
  ctx: SyncContext;
  path: AbsolutePath;
};

export class FolderCreator {
  static async run({ ctx, path }: TProps) {
    ctx.logger.debug({ msg: 'Create folder', path });

    const parentUuid = await getParentUuid({ ctx, path });

    const { data: folder, error: error2 } = await ipcRendererDriveServerWip.invoke('persistFolder', {
      ctx: {
        bucket: ctx.bucket,
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
        workspaceToken: ctx.workspaceToken,
      },
      path,
      parentUuid,
    });

    if (error2) throw error2;

    await Addon.convertToPlaceholder({ path, placeholderId: `FOLDER:${folder.uuid}` });

    return folder.uuid;
  }
}
