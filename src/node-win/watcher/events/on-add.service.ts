import { Stats } from 'node:fs';

import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { trackAddFileEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AddController } from '@/apps/sync-engine/callbacks-controllers/controllers/add-controller';

type TProps = {
  ctx: ProcessSyncContext;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export async function onAdd({ ctx, absolutePath, stats }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: ctx.virtualDrive.syncRootPath,
    path: absolutePath,
  });

  try {
    const { data: fileInfo } = NodeWin.getFileInfo({ ctx, path });

    if (!fileInfo) {
      await AddController.createFile({
        ctx,
        absolutePath,
        path,
        stats,
      });
      return;
    }

    trackAddFileEvent({ uuid: fileInfo.uuid });
    await moveFile({ ctx, path, uuid: fileInfo.uuid });
  } catch (error) {
    ctx.logger.error({ msg: 'Error on event "add"', path, error });
  }
}
