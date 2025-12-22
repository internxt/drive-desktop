import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import { trackAddFolderEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Drive } from '@/backend/features/drive';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onAddDir({ ctx, path }: TProps) {
  try {
    const { data: folderInfo } = await NodeWin.getFolderInfo({ ctx, path });

    if (folderInfo) {
      trackAddFolderEvent({ uuid: folderInfo.uuid });
      await moveFolder({ ctx, path, uuid: folderInfo.uuid });
      return;
    }

    const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: dirname(path) });

    if (parentInfo) {
      await Drive.Actions.createFolder({
        ctx,
        path,
        parentUuid: parentInfo.uuid,
      });
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error on addDir event', path, error });
  }
}
