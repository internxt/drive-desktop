import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { trackAddEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export async function onAdd({ ctx, self, absolutePath, stats }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: self.virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const { data: uuid } = NodeWin.getFileUuid({ drive: self.virtualDrive, path });

    if (!uuid) {
      self.fileInDevice.add(absolutePath);
      await self.callbacks.addController.createFile({
        ctx,
        absolutePath,
        path,
        stats,
      });
      return;
    }

    void trackAddEvent({ uuid });
    await moveFile({ self, path, absolutePath, uuid });
  } catch (error) {
    self.logger.error({ msg: 'Error on event "add"', path, error });
  }
}
