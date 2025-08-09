import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import { trackAddDirEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { SyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: SyncContext;
  self: Watcher;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export async function onAddDir({ ctx, self, absolutePath, stats }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: self.virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const { data: uuid } = NodeWin.getFolderUuid({
      drive: self.virtualDrive,
      path,
    });

    if (!uuid) {
      await self.callbacks.addController.createFolder({ ctx, path });
      return;
    }

    const creationTime = new Date(stats.birthtime).getTime();
    const modificationTime = new Date(stats.mtime).getTime();

    if (creationTime === modificationTime) {
      /* Folder added from remote */
    } else {
      void trackAddDirEvent({ uuid });
      await moveFolder({ self, path, uuid });
    }
  } catch (error) {
    self.logger.error({ msg: 'Error en onAddDir', error });
  }
}
