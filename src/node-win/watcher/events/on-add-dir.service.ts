import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import { trackAddFolderEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { createFolder } from '@/features/sync/add-item/create-folder';

type TProps = {
  ctx: ProcessSyncContext;
  absolutePath: AbsolutePath;
};

export async function onAddDir({ ctx, absolutePath }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: ctx.virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const { data: uuid } = NodeWin.getFolderUuid({ ctx, path });

    if (!uuid) {
      await createFolder({ ctx, path, absolutePath });
      return;
    }

    trackAddFolderEvent({ uuid });
    await moveFolder({ ctx, path, absolutePath, uuid });
  } catch (error) {
    ctx.logger.error({ msg: 'Error on event "addDir"', error });
  }
}
