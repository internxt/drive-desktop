import { Watcher } from '../watcher';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import { trackAddFolderEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { createFolder } from '@/features/sync/add-item/create-folder';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  absolutePath: AbsolutePath;
};

export async function onAddDir({ ctx, self, absolutePath }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: self.virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const { data: uuid } = NodeWin.getFolderUuid({
      drive: ctx.virtualDrive,
      path,
    });

    if (!uuid) {
      await createFolder({ ctx, path, absolutePath });
      return;
    }

    trackAddFolderEvent({ uuid });
    await moveFolder({ self, path, absolutePath, uuid });
  } catch (error) {
    self.logger.error({ msg: 'Error on event "addDir"', error });
  }
}
